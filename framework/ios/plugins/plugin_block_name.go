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

type BlockedNames struct {
	allWeeklyRanges *map[string]dnscrypt.WeeklyRanges
	patternMatcher  *PatternMatcherMmap
	logger          *lumberjack.Logger
	format          string
}

const aliasesLimit = 8

var blockedNames *BlockedNames

func (blockedNames *BlockedNames) check(pluginsState *dnscrypt.PluginsState, qName string, aliasFor *string) (bool, error) {
	reject, reason, xweeklyRanges := blockedNames.patternMatcher.Eval(qName)
	if aliasFor != nil {
		reason = reason + " (alias for [" + *aliasFor + "])"
	}
	var weeklyRanges *dnscrypt.WeeklyRanges
	if xweeklyRanges != nil {
		switch v := xweeklyRanges.(type) {
		case string:
			if len(v) > 0 && v != "-" {
				weeklyRangesX := (*blockedNames.allWeeklyRanges)[v]
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
	if !reject {
		return false, nil
	}
	pluginsState.SetAction(dnscrypt.PluginsActionReject)
	pluginsState.SetReturnCode(dnscrypt.PluginsReturnCodeReject)
	if blockedNames.logger != nil {
		var clientIPStr string
		if pluginsState.GetClientProto() == "udp" {
			clientIPStr = (*pluginsState.GetClientAddr()).(*net.UDPAddr).IP.String()
		} else {
			clientIPStr = (*pluginsState.GetClientAddr()).(*net.TCPAddr).IP.String()
		}
		var line string
		if blockedNames.format == "tsv" {
			now := time.Now()
			year, month, day := now.Date()
			hour, minute, second := now.Clock()
			tsStr := fmt.Sprintf("[%d-%02d-%02d %02d:%02d:%02d]", year, int(month), day, hour, minute, second)
			line = fmt.Sprintf("%s\t%s\t%s\t%s\n", tsStr, clientIPStr, dnscrypt.StringQuote(qName), dnscrypt.StringQuote(reason))
		} else if blockedNames.format == "ltsv" {
			line = fmt.Sprintf("time:%d\thost:%s\tqname:%s\tmessage:%s\n", time.Now().Unix(), clientIPStr, dnscrypt.StringQuote(qName), dnscrypt.StringQuote(reason))
		} else {
			dlog.Fatalf("Unexpected log format: [%s]", blockedNames.format)
		}
		if blockedNames.logger == nil {
			return false, errors.New("Log file not initialized")
		}
		_, _ = blockedNames.logger.Write([]byte(line))
	}
	return true, nil
}

// ---

type PluginBlockName struct {
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

	xBlockedNames := BlockedNames{
		allWeeklyRanges: proxy.GetAllWeeklyRanges(),
		patternMatcher:  NewPatternPatcherMmap(fileName),
	}

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
			dlog.Errorf("Syntax error in block rules at line %d -- Unexpected @ character", 1+lineNo)
			continue
		}
		var weeklyRanges *dnscrypt.WeeklyRanges
		if len(timeRangeName) > 0 {
			weeklyRangesX, ok := (*xBlockedNames.allWeeklyRanges)[timeRangeName]
			if !ok {
				dlog.Errorf("Time range [%s] not found at line %d", timeRangeName, 1+lineNo)
			} else {
				weeklyRanges = &weeklyRangesX
			}
		}

		if err := xBlockedNames.patternMatcher.Add(line, weeklyRanges, lineNo+1); err != nil {
			dlog.Error(err)
			continue
		}

		lineNo++
	}
	blockedNames = &xBlockedNames
	if len(proxy.GetBlockNameLogFile()) == 0 {
		return nil
	}
	blockedNames.logger = &lumberjack.Logger{LocalTime: true, MaxSize: proxy.GetLogMaxSize(), MaxAge: proxy.GetLogMaxAge(), MaxBackups: proxy.GetLogMaxBackups(), Filename: proxy.GetBlockNameLogFile(), Compress: true}
	blockedNames.format = proxy.GetBlockNameFormat()

	return nil
}

func (plugin *PluginBlockName) Drop() error {
	return nil
}

func (plugin *PluginBlockName) Reload() error {
	return nil
}

func (plugin *PluginBlockName) Eval(pluginsState *dnscrypt.PluginsState, msg *dns.Msg) error {
	if blockedNames == nil || pluginsState.GetSessionDataKey("whitelisted") != nil {
		return nil
	}
	_, err := blockedNames.check(pluginsState, pluginsState.GetQName(), nil)
	return err
}

// ---

type PluginBlockNameResponse struct {
}

func (plugin *PluginBlockNameResponse) Name() string {
	return "block_name"
}

func (plugin *PluginBlockNameResponse) Description() string {
	return "Block DNS responses matching name patterns"
}

func (plugin *PluginBlockNameResponse) Init(proxy *dnscrypt.Proxy) error {
	return nil
}

func (plugin *PluginBlockNameResponse) Drop() error {
	return nil
}

func (plugin *PluginBlockNameResponse) Reload() error {
	return nil
}

func (plugin *PluginBlockNameResponse) Eval(pluginsState *dnscrypt.PluginsState, msg *dns.Msg) error {
	if blockedNames == nil || pluginsState.GetSessionDataKey("whitelisted") != nil {
		return nil
	}
	aliasFor := pluginsState.GetQName()
	aliasesLeft := aliasesLimit
	answers := msg.Answer
	for _, answer := range answers {
		header := answer.Header()
		if header.Class != dns.ClassINET || header.Rrtype != dns.TypeCNAME {
			continue
		}
		target, err := dnscrypt.NormalizeQName(answer.(*dns.CNAME).Target)
		if err != nil {
			return err
		}
		if blocked, err := blockedNames.check(pluginsState, target, &aliasFor); blocked || err != nil {
			return err
		}
		aliasesLeft--
		if aliasesLeft == 0 {
			break
		}
	}
	return nil
}
