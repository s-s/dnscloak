/* Copyright (C) 2019 Sergey Smirnov
 * 
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

package dnscryptproxy

import (
	"github.com/jedisct1/dlog"

	dnscrypt "github.com/jedisct1/dnscrypt-proxy/dnscrypt-proxy"
)

func PrefetchSourceURLCloak(timeout_int int, useIPv4 bool, useIPv6 bool, fallbackResolver string, ignoreSystemDNS bool, url string, cacheFile string) error {
	xTransport := dnscrypt.NewXTransport()
	xTransport.SetupXTransportCloak(useIPv4, useIPv6, fallbackResolver, ignoreSystemDNS)
	return dnscrypt.PrefetchSourceURLCloak(xTransport, url, cacheFile)
}

func RefreshServersInfoCloak(app *App) {
	dnscrypt.RefreshServersInfoCloak(&app.proxy)
}

func (app *App) LogDebug(s string) {
	dlog.Debug(s)
}

func (app *App) LogInfo(s string) {
	dlog.Info(s)
}

func (app *App) LogNotice(s string) {
	dlog.Notice(s)
}

func (app *App) LogWarn(s string) {
	dlog.Warn(s)
}

func (app *App) LogError(s string) {
	dlog.Error(s)
}

func (app *App) LogCritical(s string) {
	dlog.Critical(s)
}

func (app *App) LogFatal(s string) {
	dlog.Fatal(s)
}
