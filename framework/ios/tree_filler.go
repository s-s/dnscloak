/* Copyright (C) 2019 Sergey Smirnov
 * 
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

package dnscryptproxy

import (
	"bufio"
	"mradix"
	"net"
	"os"
	"strings"
	"unicode"

	dnscrypt "github.com/jedisct1/dnscrypt-proxy/dnscrypt-proxy"
)

func isGlobCandidate(str string) bool {
	for i, c := range str {
		if c == '?' || c == '[' {
			return true
		} else if c == '*' && i != 0 && i != len(str)-1 {
			return true
		}
	}
	return false
}

func FillPatternlistTrees(filepath string) error {
	file, err := os.Open(filepath)
	if err != nil {
		return err
	}
	defer file.Close()

	blockedSuffixes, err := mradix.NewTreeMarshal(filepath + ".suffixes")
	if err != nil {
		return err
	}
	defer blockedSuffixes.Close()

	blockedPrefixes, err := mradix.NewTreeMarshal(filepath + ".prefixes")
	if err != nil {
		return err
	}
	defer blockedPrefixes.Close()

	lineNo := 0
	s := bufio.NewScanner(file)
	for s.Scan() {
		line := strings.TrimFunc(s.Text(), unicode.IsSpace)
		if len(line) == 0 || strings.HasPrefix(line, "#") {
			continue
		}
		parts := strings.Split(line, "@")
		timeRangeName := "-"
		if len(parts) == 2 {
			line = strings.TrimFunc(parts[0], unicode.IsSpace)
			timeRangeName = strings.TrimFunc(parts[1], unicode.IsSpace)
		} else if len(parts) > 2 {
			////////dlog.Errorf("Syntax error in block rules at line %d -- Unexpected @ character", 1+lineNo)
			continue
		}
		leadingStar := strings.HasPrefix(line, "*")
		trailingStar := strings.HasSuffix(line, "*")
		exact := strings.HasPrefix(line, "=")
		blockType := dnscrypt.PatternTypeNone
		if isGlobCandidate(line) {

		} else if leadingStar && trailingStar {

		} else if trailingStar {
			blockType = dnscrypt.PatternTypePrefix
			if len(line) < 2 {
				///////////dlog.Errorf("Syntax error in block rules at line %d", 1+lineNo)
				continue
			}
			line = line[:len(line)-1]
		} else if exact {
		} else {
			blockType = dnscrypt.PatternTypeSuffix
			if leadingStar {
				line = line[1:]
			}
			line = strings.TrimPrefix(line, ".")
		}
		if len(line) == 0 {
			///////////dlog.Errorf("Syntax error in block rule at line %d", 1+lineNo)
			continue
		}

		line = strings.ToLower(line)
		switch blockType {
		case dnscrypt.PatternTypePrefix:
			blockedPrefixes.Insert(line, timeRangeName)
		case dnscrypt.PatternTypeSuffix:
			blockedSuffixes.Insert(dnscrypt.StringReverse(line), timeRangeName)
		}

		lineNo++
	}

	if err := s.Err(); err != nil {
		return err
	}

	return nil
}

func FillIpBlacklistTrees(filepath string) error {
	file, err := os.Open(filepath)
	if err != nil {
		return err
	}
	defer file.Close()

	blockedPrefixes, err := mradix.NewTreeMarshal(filepath + ".prefixes")
	if err != nil {
		return err
	}
	defer blockedPrefixes.Close()

	lineNo := 0
	s := bufio.NewScanner(file)
	for s.Scan() {
		/////blockedPrefixes.Insert(line, timeRangeName)
		line := strings.TrimFunc(s.Text(), unicode.IsSpace)
		if len(line) == 0 || strings.HasPrefix(line, "#") {
			continue
		}
		ip := net.ParseIP(line)
		trailingStar := strings.HasSuffix(line, "*")
		if len(line) < 2 || (ip != nil && trailingStar) {
			/////////dlog.Errorf("Suspicious IP blocking rule [%s] at line %d", line, lineNo)
			continue
		}
		if trailingStar {
			line = line[:len(line)-1]
		}
		if strings.HasSuffix(line, ":") || strings.HasSuffix(line, ".") {
			line = line[:len(line)-1]
		}
		if len(line) == 0 {
			//////////dlog.Errorf("Empty IP blocking rule at line %d", lineNo)
			continue
		}
		if strings.Contains(line, "*") {
			///////dlog.Errorf("Invalid rule: [%s] - wildcards can only be used as a suffix at line %d", line, lineNo)
			continue
		}
		line = strings.ToLower(line)
		if trailingStar {
			blockedPrefixes.Insert(line, "-")
		}

		lineNo++
	}

	if err := s.Err(); err != nil {
		return err
	}

	return nil
}
