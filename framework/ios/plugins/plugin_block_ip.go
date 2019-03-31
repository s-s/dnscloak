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

	"mradix"

	"bufio"
	"os"

	"github.com/jedisct1/dlog"
	"github.com/miekg/dns"
	lumberjack "gopkg.in/natefinch/lumberjack.v2"

	dnscrypt "github.com/jedisct1/dnscrypt-proxy/dnscrypt-proxy"
)

type PluginBlockIP struct {
	blockedPrefixes *mradix.Tree
	blockedIPs      map[string]interface{}
	logger          *lumberjack.Logger
	format          string
}

func (plugin *PluginBlockIP) Name() string {
	return "block_ip"
}

func (plugin *PluginBlockIP) Description() string {
	return "Block responses containing specific IP addresses"
}

func (plugin *PluginBlockIP) Init(proxy *dnscrypt.Proxy) error {
	fileName := proxy.GetBlockIPFile()
	dlog.Noticef("Loading the set of IP blocking rules from [%s]", fileName)

	file, err := os.Open(fileName)
	if err != nil {
		return err
	}
	defer file.Close()

	plugin.blockedPrefixes, err = mradix.NewTree(fileName + ".prefixes")
	if err != nil {
		return err
	}
	plugin.blockedIPs = make(map[string]interface{})
	lineNo := 0
	scanner := bufio.NewScanner(file)

	for scanner.Scan() {
		line := strings.TrimFunc(scanner.Text(), unicode.IsSpace)
		if len(line) == 0 || strings.HasPrefix(line, "#") {
			continue
		}
		ip := net.ParseIP(line)
		trailingStar := strings.HasSuffix(line, "*")
		if len(line) < 2 || (ip != nil && trailingStar) {
			dlog.Errorf("Suspicious IP blocking rule [%s] at line %d", line, lineNo)
			continue
		}
		if trailingStar {
			line = line[:len(line)-1]
		}
		if strings.HasSuffix(line, ":") || strings.HasSuffix(line, ".") {
			line = line[:len(line)-1]
		}
		if len(line) == 0 {
			dlog.Errorf("Empty IP blocking rule at line %d", lineNo)
			continue
		}
		if strings.Contains(line, "*") {
			dlog.Errorf("Invalid rule: [%s] - wildcards can only be used as a suffix at line %d", line, lineNo)
			continue
		}
		line = strings.ToLower(line)
		if trailingStar {
			//plugin.blockedPrefixes, _, _ = plugin.blockedPrefixes.Insert([]byte(line), 0)
		} else {
			plugin.blockedIPs[line] = true
		}
		lineNo++
	}
	if len(proxy.GetBlockIPLogFile()) == 0 {
		return nil
	}
	plugin.logger = &lumberjack.Logger{LocalTime: true, MaxSize: proxy.GetLogMaxSize(), MaxAge: proxy.GetLogMaxAge(), MaxBackups: proxy.GetLogMaxBackups(), Filename: proxy.GetBlockIPLogFile(), Compress: true}
	plugin.format = proxy.GetBlockIPFormat()

	return nil
}

func (plugin *PluginBlockIP) Drop() error {
	plugin.blockedPrefixes.Close()
	return nil
}

func (plugin *PluginBlockIP) Reload() error {
	return nil
}

func (plugin *PluginBlockIP) Eval(pluginsState *dnscrypt.PluginsState, msg *dns.Msg) error {
	if pluginsState.GetSessionDataKey("whitelisted") != nil {
		return nil
	}
	answers := msg.Answer
	if len(answers) == 0 {
		return nil
	}
	reject, reason, ipStr := false, "", ""
	for _, answer := range answers {
		header := answer.Header()
		Rrtype := header.Rrtype
		if header.Class != dns.ClassINET || (Rrtype != dns.TypeA && Rrtype != dns.TypeAAAA) {
			continue
		}
		if Rrtype == dns.TypeA {
			ipStr = answer.(*dns.A).A.String()
		} else if Rrtype == dns.TypeAAAA {
			ipStr = answer.(*dns.AAAA).AAAA.String() // IPv4-mapped IPv6 addresses are converted to IPv4
		}
		if _, found := plugin.blockedIPs[ipStr]; found {
			reject, reason = true, ipStr
			break
		}
		match, lastVal, found := plugin.blockedPrefixes.LongestPrefix([]byte(ipStr))
		if found && len(lastVal) > 0 {
			if len(match) == len(ipStr) || (ipStr[len(match)] == '.' || ipStr[len(match)] == ':') {
				reject, reason = true, string(match)+"*"
				break
			}
		}
	}
	if reject {
		pluginsState.SetAction(dnscrypt.PluginsActionReject)
		pluginsState.SetReturnCode(dnscrypt.PluginsReturnCodeReject)
		if plugin.logger != nil {
			questions := msg.Question
			if len(questions) != 1 {
				return nil
			}
			qName := strings.ToLower(dnscrypt.StripTrailingDot(questions[0].Name))
			if len(qName) < 2 {
				return nil
			}
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
				line = fmt.Sprintf("%s\t%s\t%s\t%s\t%s\n", tsStr, clientIPStr, dnscrypt.StringQuote(qName), dnscrypt.StringQuote(ipStr), dnscrypt.StringQuote(reason))
			} else if plugin.format == "ltsv" {
				line = fmt.Sprintf("time:%d\thost:%s\tqname:%s\tip:%s\tmessage:%s\n", time.Now().Unix(), clientIPStr, dnscrypt.StringQuote(qName), dnscrypt.StringQuote(ipStr), dnscrypt.StringQuote(reason))
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
