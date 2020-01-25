/* Copyright (C) 2019 Sergey Smirnov
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

package plugins

import (
	"fmt"
	"path/filepath"
	"strings"

	"github.com/jedisct1/dlog"

	dnscrypt "github.com/jedisct1/dnscrypt-proxy/dnscrypt-proxy"
	mradix "github.com/jedisct1/dnscrypt-proxy/dnscrypt-proxy/ios/mradix"
)

type PatternMatcherMmap struct {
	blockedPrefixes   *mradix.Tree
	blockedSuffixes   *mradix.Tree
	blockedSubstrings []string
	blockedPatterns   []string
	blockedExact      map[string]interface{}
	indirectVals      map[string]interface{}
}

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

func NewPatternPatcherMmap(path string) *PatternMatcherMmap {
	patternMatcher := PatternMatcherMmap{
		blockedExact: make(map[string]interface{}),
		indirectVals: make(map[string]interface{}),
	}

	var err error

	patternMatcher.blockedPrefixes, err = mradix.NewTree(path + ".prefixes")
	if err != nil {
		dlog.Errorf("Error load prefixes %s", path)
		return nil
	}

	patternMatcher.blockedSuffixes, err = mradix.NewTree(path + ".suffixes")
	if err != nil {
		dlog.Errorf("Error load suffixes %s", path)
		return nil
	}
	return &patternMatcher
}

func (patternMatcher *PatternMatcherMmap) Add(pattern string, val interface{}, position int) error {
	leadingStar := strings.HasPrefix(pattern, "*")
	trailingStar := strings.HasSuffix(pattern, "*")
	exact := strings.HasPrefix(pattern, "=")
	patternType := dnscrypt.PatternTypeNone
	if isGlobCandidate(pattern) {
		patternType = dnscrypt.PatternTypePattern
		_, err := filepath.Match(pattern, "example.com")
		if len(pattern) < 2 || err != nil {
			return fmt.Errorf("Syntax error in block rules at pattern %d", position)
		}
	} else if leadingStar && trailingStar {
		patternType = dnscrypt.PatternTypeSubstring
		if len(pattern) < 3 {
			return fmt.Errorf("Syntax error in block rules at pattern %d", position)
		}
		pattern = pattern[1 : len(pattern)-1]
	} else if trailingStar {
		patternType = dnscrypt.PatternTypePrefix
		if len(pattern) < 2 {
			return fmt.Errorf("Syntax error in block rules at pattern %d", position)
		}
		pattern = pattern[:len(pattern)-1]
	} else if exact {
		patternType = dnscrypt.PatternTypeExact
		if len(pattern) < 2 {
			return fmt.Errorf("Syntax error in block rules at pattern %d", position)
		}
		pattern = pattern[1:]
	} else {
		patternType = dnscrypt.PatternTypeSuffix
		if leadingStar {
			pattern = pattern[1:]
		}
		pattern = strings.TrimPrefix(pattern, ".")
	}
	if len(pattern) == 0 {
		dlog.Errorf("Syntax error in block rule at line %d", position)
	}

	pattern = strings.ToLower(pattern)
	switch patternType {
	case dnscrypt.PatternTypeSubstring:
		patternMatcher.blockedSubstrings = append(patternMatcher.blockedSubstrings, pattern)
		if val != nil {
			patternMatcher.indirectVals[pattern] = val
		}
	case dnscrypt.PatternTypePattern:
		patternMatcher.blockedPatterns = append(patternMatcher.blockedPatterns, pattern)
		if val != nil {
			patternMatcher.indirectVals[pattern] = val
		}
	case dnscrypt.PatternTypePrefix:
		//patternMatcher.blockedPrefixes.Insert([]byte(pattern), val)
	case dnscrypt.PatternTypeSuffix:
		//patternMatcher.blockedSuffixes.Insert([]byte(StringReverse(pattern)), val)
	case dnscrypt.PatternTypeExact:
		patternMatcher.blockedExact[pattern] = val
	default:
		dlog.Fatal("Unexpected block type")
	}
	return nil
}

func (patternMatcher *PatternMatcherMmap) Eval(qName string) (reject bool, reason string, val interface{}) {
	if len(qName) < 2 {
		return false, "", nil
	}

	revQname := dnscrypt.StringReverse(qName)
	if match, xval, found := patternMatcher.blockedSuffixes.LongestPrefix([]byte(revQname)); found {
		if len(match) == len(revQname) || revQname[len(match)] == '.' {
			if len(xval) > 0 {
				//dlog.Warnf("[1] match[%s] qName[%s]", string(match), qName)
				return true, "*." + dnscrypt.StringReverse(string(match)), string(xval)
			}
			//return true, "*." + StringReverse(string(match)), ""
		}
		if len(match) < len(revQname) && len(revQname) > 0 {
			if i := strings.LastIndex(revQname, "."); i > 0 {
				pName := revQname[:i]
				if match, _, found := patternMatcher.blockedSuffixes.LongestPrefix([]byte(pName)); found {
					if len(match) == len(pName) || pName[len(match)] == '.' {
						if len(xval) > 0 {
							//dlog.Warnf("[2] match[%s] pName[%s]", string(match), pName)
							return true, "*." + dnscrypt.StringReverse(string(match)), string(xval)
						}
						//return true, "*." + StringReverse(string(match)), ""
					}
				}
			}
		}
	}

	if match, xval, found := patternMatcher.blockedPrefixes.LongestPrefix([]byte(qName)); found {
		if len(xval) > 0 {
			return true, string(match) + "*", string(xval)
		}
		//return true, string(match) + "*", ""
	}

	for _, substring := range patternMatcher.blockedSubstrings {
		if strings.Contains(qName, substring) {
			return true, "*" + substring + "*", patternMatcher.indirectVals[substring]
		}
	}

	for _, pattern := range patternMatcher.blockedPatterns {
		if found, _ := filepath.Match(pattern, qName); found {
			return true, pattern, patternMatcher.indirectVals[pattern]
		}
	}

	if xval := patternMatcher.blockedExact[qName]; xval != nil {
		return true, qName, xval
	}

	return false, "", nil
}
