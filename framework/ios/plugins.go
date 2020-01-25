/* Copyright (C) 2019 Sergey Smirnov
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

package dnscryptproxy

import (
	dnscrypt "github.com/jedisct1/dnscrypt-proxy/dnscrypt-proxy"
	plugins "github.com/jedisct1/dnscrypt-proxy/dnscrypt-proxy/ios/plugins"
)

func initPluginsGlobals(pluginsGlobals *dnscrypt.PluginsGlobals, proxy *dnscrypt.Proxy) error {
	queryPlugins := &[]dnscrypt.Plugin{}
	if len(proxy.GetQueryMeta()) != 0 {
		*queryPlugins = append(*queryPlugins, dnscrypt.Plugin(new(dnscrypt.PluginQueryMeta)))
	}
	if len(proxy.GetWhitelistNameFile()) != 0 {
		*queryPlugins = append(*queryPlugins, dnscrypt.Plugin(new(plugins.PluginWhitelistName)))
	}
	*queryPlugins = append(*queryPlugins, dnscrypt.Plugin(new(dnscrypt.PluginFirefox)))
	if len(proxy.GetBlockNameFile()) != 0 {
		*queryPlugins = append(*queryPlugins, dnscrypt.Plugin(new(plugins.PluginBlockName)))
	}
	if proxy.GetPluginBlockIPv6() {
		*queryPlugins = append(*queryPlugins, dnscrypt.Plugin(new(dnscrypt.PluginBlockIPv6)))
	}
	if len(proxy.GetCloakFile()) != 0 {
		*queryPlugins = append(*queryPlugins, dnscrypt.Plugin(new(dnscrypt.PluginCloak)))
	}
	*queryPlugins = append(*queryPlugins, dnscrypt.Plugin(new(dnscrypt.PluginGetSetPayloadSize)))
	if proxy.GetCache() {
		*queryPlugins = append(*queryPlugins, dnscrypt.Plugin(new(dnscrypt.PluginCache)))
	}
	if len(proxy.GetForwardFile()) != 0 {
		*queryPlugins = append(*queryPlugins, dnscrypt.Plugin(new(dnscrypt.PluginForward)))
	}
	if proxy.GetPluginBlockUnqualified() {
		*queryPlugins = append(*queryPlugins, dnscrypt.Plugin(new(dnscrypt.PluginBlockUnqualified)))
	}
	if proxy.GetPluginBlockUndelegated() {
		*queryPlugins = append(*queryPlugins, dnscrypt.Plugin(new(dnscrypt.PluginBlockUndelegated)))
	}

	responsePlugins := &[]dnscrypt.Plugin{}
	if len(proxy.GetNXLogFile()) != 0 {
		*responsePlugins = append(*responsePlugins, dnscrypt.Plugin(new(dnscrypt.PluginNxLog)))
	}
	if len(proxy.GetBlockNameFile()) != 0 {
		*responsePlugins = append(*responsePlugins, dnscrypt.Plugin(new(plugins.PluginBlockNameResponse)))
	}
	if len(proxy.GetBlockIPFile()) != 0 {
		*responsePlugins = append(*responsePlugins, dnscrypt.Plugin(new(plugins.PluginBlockIP)))
	}
	if proxy.GetCache() {
		*responsePlugins = append(*responsePlugins, dnscrypt.Plugin(new(dnscrypt.PluginCacheResponse)))
	}

	if proxy.GetIOSMode() {
		*responsePlugins = append(*responsePlugins, dnscrypt.Plugin(new(plugins.PluginFixServfail)))
	}

	loggingPlugins := &[]dnscrypt.Plugin{}
	if len(proxy.GetQueryLogFile()) != 0 {
		*loggingPlugins = append(*loggingPlugins, dnscrypt.Plugin(new(dnscrypt.PluginQueryLog)))
	}

	for _, plugin := range *queryPlugins {
		if err := plugin.Init(proxy); err != nil {
			return err
		}
	}
	for _, plugin := range *responsePlugins {
		if err := plugin.Init(proxy); err != nil {
			return err
		}
	}
	for _, plugin := range *loggingPlugins {
		if err := plugin.Init(proxy); err != nil {
			return err
		}
	}

	pluginsGlobals.SetQueryPlugins(queryPlugins)
	pluginsGlobals.SetResponsePlugins(responsePlugins)
	pluginsGlobals.SetLoggingPlugins(loggingPlugins)
	return nil
}
