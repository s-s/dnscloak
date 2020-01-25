/* Copyright (C) 2019 Sergey Smirnov
 * 
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

package plugins

import (
	"errors"
	"fmt"
	"net"
	"strings"
	"time"
	"unicode"

	"bufio"
	"os"

	"github.com/jedisct1/dlog"
	"github.com/miekg/dns"
	lumberjack "gopkg.in/natefinch/lumberjack.v2"

	dnscrypt "github.com/jedisct1/dnscrypt-proxy/dnscrypt-proxy"
)

type PluginWhitelistName struct {
	allWeeklyRanges *map[string]dnscrypt.WeeklyRanges
	patternMatcher  *PatternMatcherMmap
	logger          *lumberjack.Logger
	format          string
}

func (plugin *PluginWhitelistName) Name() string {
	return "whitelist_name"
}

func (plugin *PluginWhitelistName) Description() string {
	return "Whitelists DNS queries matching name patterns"
}

func (plugin *PluginWhitelistName) Init(proxy *dnscrypt.Proxy) error {
	fileName := proxy.GetWhitelistNameFile()
	dlog.Noticef("Loading the set of whitelisting rules from [%s]", fileName)

	file, err := os.Open(fileName)
	if err != nil {
		return err
	}
	defer file.Close()

	plugin.allWeeklyRanges = proxy.GetAllWeeklyRanges()
	plugin.patternMatcher = NewPatternPatcherMmap(fileName)
	lineNo := 0
	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		line := scanner.Text()
		line = dnscrypt.TrimAndStripInlineComments(line)
		if len(line) == 0 {
			continue
		}
		parts := strings.Split(line, "@")
		timeRangeName := ""
		if len(parts) == 2 {
			line = strings.TrimFunc(parts[0], unicode.IsSpace)
			timeRangeName = strings.TrimFunc(parts[1], unicode.IsSpace)
		} else if len(parts) > 2 {
			dlog.Errorf("Syntax error in whitelist rules at line %d -- Unexpected @ character", 1+lineNo)
			continue
		}
		var weeklyRanges *dnscrypt.WeeklyRanges
		if len(timeRangeName) > 0 {
			weeklyRangesX, ok := (*plugin.allWeeklyRanges)[timeRangeName]
			if !ok {
				dlog.Errorf("Time range [%s] not found at line %d", timeRangeName, 1+lineNo)
			} else {
				weeklyRanges = &weeklyRangesX
			}
		}
		if err := plugin.patternMatcher.Add(line, weeklyRanges, lineNo+1); err != nil {
			dlog.Error(err)
			continue
		}
		lineNo++
	}
	if len(proxy.GetWhitelistNameLogFile()) == 0 {
		return nil
	}
	plugin.logger = &lumberjack.Logger{LocalTime: true, MaxSize: proxy.GetLogMaxSize(), MaxAge: proxy.GetLogMaxAge(), MaxBackups: proxy.GetLogMaxBackups(), Filename: proxy.GetWhitelistNameLogFile(), Compress: true}
	plugin.format = proxy.GetWhitelistNameFormat()

	return nil
}

func (plugin *PluginWhitelistName) Drop() error {
	return nil
}

func (plugin *PluginWhitelistName) Reload() error {
	return nil
}

func (plugin *PluginWhitelistName) Eval(pluginsState *dnscrypt.PluginsState, msg *dns.Msg) error {
	qName := pluginsState.GetQName()
	whitelist, reason, xweeklyRanges := plugin.patternMatcher.Eval(qName)
	var weeklyRanges *dnscrypt.WeeklyRanges
	if xweeklyRanges != nil {
		switch v := xweeklyRanges.(type) {
		case string:
			if len(v) > 0 && v != "-" {
				weeklyRangesX := (*plugin.allWeeklyRanges)[v]
				weeklyRanges = &weeklyRangesX
			}
		default:
			weeklyRanges = xweeklyRanges.(*dnscrypt.WeeklyRanges)
		}
	}
	if whitelist {
		if weeklyRanges != nil && !weeklyRanges.Match() {
			whitelist = false
		}
	}
	if whitelist {
		pluginsState.SetSessionDataKey("whitelisted", true)
		if plugin.logger != nil {
			var clientIPStr string
			if pluginsState.GetClientProto() == "udp" {
				clientIPStr = (*pluginsState.GetClientAddr()).(*net.UDPAddr).IP.String()
			} else {
				clientIPStr = (*pluginsState.GetClientAddr()).(*net.TCPAddr).IP.String()
			}
			var line string
			if plugin.format == "tsv" {
				now := time.Now()
				year, month, day := now.Date()
				hour, minute, second := now.Clock()
				tsStr := fmt.Sprintf("[%d-%02d-%02d %02d:%02d:%02d]", year, int(month), day, hour, minute, second)
				line = fmt.Sprintf("%s\t%s\t%s\t%s\n", tsStr, clientIPStr, dnscrypt.StringQuote(qName), dnscrypt.StringQuote(reason))
			} else if plugin.format == "ltsv" {
				line = fmt.Sprintf("time:%d\thost:%s\tqname:%s\tmessage:%s\n", time.Now().Unix(), clientIPStr, dnscrypt.StringQuote(qName), dnscrypt.StringQuote(reason))
			} else {
				dlog.Fatalf("Unexpected log format: [%s]", plugin.format)
			}
			if plugin.logger == nil {
				return errors.New("Log file not initialized")
			}
			_, _ = plugin.logger.Write([]byte(line))
		}
	}
	return nil
}
