/* Copyright (C) 2019 Sergey Smirnov
 * 
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

package plugins

import (
	"github.com/miekg/dns"

	dnscrypt "github.com/jedisct1/dnscrypt-proxy/dnscrypt-proxy"
)

type PluginFixServfail struct {
}

func (plugin *PluginFixServfail) Name() string {
	return "fix_servfail"
}

func (plugin *PluginFixServfail) Description() string {
	return "Fix SERVFAIL & REFUSED responses for iOS"
}

func (plugin *PluginFixServfail) Init(proxy *dnscrypt.Proxy) error {
	return nil
}

func (plugin *PluginFixServfail) Drop() error {
	return nil
}

func (plugin *PluginFixServfail) Reload() error {
	return nil
}

func (plugin *PluginFixServfail) Eval(pluginsState *dnscrypt.PluginsState, msg *dns.Msg) error {
	if msg.Rcode != dns.RcodeServerFailure && msg.Rcode != dns.RcodeRefused {
		return nil
	}

	pluginsState.SetAction(dnscrypt.PluginsActionReject)
	//pluginsState.SetReturnCode(PluginsReturnCodeReject)
	return nil
}
