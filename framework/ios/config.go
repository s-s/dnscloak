/* Copyright (C) 2019 Sergey Smirnov
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

package dnscryptproxy

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"os"
	"strings"

	"unicode"

	"github.com/BurntSushi/toml"

	dnscrypt "github.com/jedisct1/dnscrypt-proxy/dnscrypt-proxy"
	stamps "github.com/jedisct1/go-dnsstamps"
)

type serverSummary struct {
	Name        string `json:"name"`
	Proto       string `json:"proto"`
	IPv6        bool   `json:"ipv6"`
	DNSSEC      bool   `json:"dnssec"`
	NoLog       bool   `json:"nolog"`
	NoFilter    bool   `json:"nofilter"`
	Description string `json:"description,omitempty"`
	Static      bool   `json:"static"`
}

type Config struct {
	config dnscrypt.Config
}

func NewConfig() *Config {
	return &Config{
		config: dnscrypt.Config{},
	}
}

func DefaultConfig() *Config {
	return &Config{
		config: dnscrypt.DefaultConfig(),
	}
}

func (config *Config) LoadToml(cfg string) error {
	md, err := toml.Decode(cfg, &(config.config))
	if err != nil {
		return err
	}

	undecoded := md.Undecoded()
	if len(undecoded) > 0 {
		return fmt.Errorf("Unsupported key in configuration: [%s]", undecoded[0])
	}

	return nil
}

func (config *Config) ToToml() (string, error) {
	var buf bytes.Buffer

	err := toml.NewEncoder(&buf).Encode(&(config.config))
	if err != nil {
		return "", err
	}

	return buf.String(), nil
}

func (config *Config) LoadJson(cfg string) error {
	err := json.Unmarshal([]byte(cfg), &(config.config))
	if err != nil {
		return err
	}

	return nil
}

func (config *Config) ToJson() (string, error) {
	j, err := json.Marshal(&(config.config))
	if err != nil {
		return "", err
	}

	return string(j[:]), nil
}

func (config *Config) ListServers() (string, error) {
	registeredServers := []serverSummary{}

	for cfgSourceName, cfgSource := range config.config.SourcesConfig {
		if cfgSource.CacheFile == "" {
			return "", fmt.Errorf("Missing cache file for source [%s]", cfgSourceName)
		}
		if cfgSource.FormatStr == "" {
			cfgSource.FormatStr = "v2"
		}

		_, err := os.Stat(cfgSource.CacheFile)
		if err != nil {
			return "", fmt.Errorf("Cache file [%s] not present", cfgSource.CacheFile)
		}

		var bin []byte
		bin, err = ioutil.ReadFile(cfgSource.CacheFile)
		if err != nil {
			return "", fmt.Errorf("Cache file [%s] read error", cfgSource.CacheFile)
		}
		in := string(bin)

		parts := strings.Split(in, "## ")
		if len(parts) < 2 {
			return "", fmt.Errorf("1 Invalid format for source at [%s]", cfgSourceName)
		}
		parts = parts[1:]
		for _, part := range parts {
			part = strings.TrimFunc(part, unicode.IsSpace)
			subparts := strings.Split(part, "\n")
			if len(subparts) < 2 {
				return "", fmt.Errorf("2 Invalid format for source at [%s]", cfgSourceName)
			}
			name := strings.TrimFunc(subparts[0], unicode.IsSpace)
			if len(name) == 0 {
				return "", fmt.Errorf("3 Invalid format for source at [%s]", cfgSourceName)
			}
			subparts = subparts[1:]
			name = cfgSource.Prefix + name
			var stampStr, description string
			for _, subpart := range subparts {
				subpart = strings.TrimFunc(subpart, unicode.IsSpace)
				if strings.HasPrefix(subpart, "sdns:") {
					if len(stampStr) > 0 {
						return "", fmt.Errorf("Multiple stamps for server [%s] in source from [%v]", name, cfgSourceName)
					}
					stampStr = subpart
					continue
				} else if len(subpart) == 0 || strings.HasPrefix(subpart, "//") {
					continue
				}
				if len(description) > 0 {
					description += "\n"
				}
				description += subpart
			}
			if len(stampStr) < 6 {
				return "", fmt.Errorf("Missing stamp for server [%s] in source from [%v]", name, cfgSourceName)
			}
			stamp, err := stamps.NewServerStampFromString(stampStr)
			if err != nil {
				return "", fmt.Errorf("Invalid or unsupported stamp: [%v]", stampStr)
			}

			summary := serverSummary{
				Name:        name,
				Proto:       stamp.Proto.String(),
				IPv6:        strings.HasPrefix(stamp.ServerAddrStr, "["),
				DNSSEC:      stamp.Props&stamps.ServerInformalPropertyDNSSEC != 0,
				NoLog:       stamp.Props&stamps.ServerInformalPropertyNoLog != 0,
				NoFilter:    stamp.Props&stamps.ServerInformalPropertyNoFilter != 0,
				Description: description,
				Static:      false,
			}

			registeredServers = append(registeredServers, summary)
		}
	}

	for cfgSrvName, cfgSrv := range config.config.ServersConfig {
		stamp, err := stamps.NewServerStampFromString(cfgSrv.Stamp)
		if err != nil {
			return "", fmt.Errorf("Invalid or unsupported stamp: [%v]", cfgSrv.Stamp)
		}

		summary := serverSummary{
			Name:        cfgSrvName,
			Proto:       stamp.Proto.String(),
			IPv6:        strings.HasPrefix(stamp.ServerAddrStr, "["),
			DNSSEC:      stamp.Props&stamps.ServerInformalPropertyDNSSEC != 0,
			NoLog:       stamp.Props&stamps.ServerInformalPropertyNoLog != 0,
			NoFilter:    stamp.Props&stamps.ServerInformalPropertyNoFilter != 0,
			Description: "",
			Static:      true,
		}

		registeredServers = append(registeredServers, summary)
	}

	j, err := json.Marshal(&registeredServers)
	if err != nil {
		return "", err
	}

	return string(j[:]), nil
}
