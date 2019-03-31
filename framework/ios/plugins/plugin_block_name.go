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

type PluginBlockName struct {
	allWeeklyRanges *map[string]dnscrypt.WeeklyRanges
	patternMatcher  *PatternMatcherMmap
	logger          *lumberjack.Logger
	format          string
}

func (plugin *PluginBlockName) Name() string {
	return "block_name"
}

func (plugin *PluginBlockName) Description() string {
	return "Block DNS queries matching name patterns"
}

func (plugin *PluginBlockName) Init(proxy *dnscrypt.Proxy) error {
	fileName := proxy.GetBlockNameFile()
	dlog.Noticef("Loading the set of blocking rules from [%s]", fileName)

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
		line = strings.TrimFunc(line, unicode.IsSpace)
		if len(line) == 0 || strings.HasPrefix(line, "#") {
			continue
		}
		parts := strings.Split(line, "@")
		timeRangeName := ""
		if len(parts) == 2 {
			line = strings.TrimFunc(parts[0], unicode.IsSpace)
			timeRangeName = strings.TrimFunc(parts[1], unicode.IsSpace)
		} else if len(parts) > 2 {
			dlog.Errorf("Syntax error in block rules at line %d -- Unexpected @ character", 1+lineNo)
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

		//DNSCloak
		/*leadingStar := strings.HasPrefix(line, "*")
		trailingStar := strings.HasSuffix(line, "*")
		exact := strings.HasPrefix(line, "=")
		shouldAdd := false
		if isGlobCandidate(line) {
			shouldAdd = true
		} else if leadingStar && trailingStar {
			shouldAdd = true
		} else if exact {
			shouldAdd = true
		}*/
		//DNSCloak

		//if shouldAdd {
		if _, err := plugin.patternMatcher.Add(line, weeklyRanges, lineNo+1); err != nil {
			dlog.Error(err)
			continue
		}
		//}
		lineNo++
	}
	if len(proxy.GetBlockNameLogFile()) == 0 {
		return nil
	}
	plugin.logger = &lumberjack.Logger{LocalTime: true, MaxSize: proxy.GetLogMaxSize(), MaxAge: proxy.GetLogMaxAge(), MaxBackups: proxy.GetLogMaxBackups(), Filename: proxy.GetBlockNameLogFile(), Compress: true}
	plugin.format = proxy.GetBlockNameFormat()

	return nil
}

func (plugin *PluginBlockName) Drop() error {
	return nil
}

func (plugin *PluginBlockName) Reload() error {
	return nil
}

func (plugin *PluginBlockName) Eval(pluginsState *dnscrypt.PluginsState, msg *dns.Msg) error {
	if pluginsState.GetSessionDataKey("whitelisted") != nil {
		return nil
	}
	questions := msg.Question
	if len(questions) != 1 {
		return nil
	}
	qName := strings.ToLower(dnscrypt.StripTrailingDot(questions[0].Name))
	reject, reason, xweeklyRanges := plugin.patternMatcher.Eval(qName)
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
	if reject {
		if weeklyRanges != nil && !weeklyRanges.Match() {
			reject = false
		}
	}
	if reject {
		pluginsState.SetAction(dnscrypt.PluginsActionReject)
		pluginsState.SetReturnCode(dnscrypt.PluginsReturnCodeReject)
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
			plugin.logger.Write([]byte(line))
		}
	}
	return nil
}
