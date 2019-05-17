/* Copyright (C) 2019 Sergey Smirnov
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

package dnscryptproxy

import (
	"fmt"
	"os"
	"runtime/debug"
	"sync"
	"time"

	dnscrypt "github.com/jedisct1/dnscrypt-proxy/dnscrypt-proxy"

	"github.com/jedisct1/dlog"
)

type App struct {
	wg    sync.WaitGroup
	quit  chan bool
	proxy dnscrypt.Proxy
}

type CloakCallback interface {
	ProxyReady()
}

func Main(configFile string) *App {
	goDebug := os.Getenv("GODEBUG")
	if goDebug == "" {
		goDebug = "tls13=1"
	} else {
		goDebug = fmt.Sprintf("%s,tls13=1", goDebug)
	}

	tls13ok := true
	if err := os.Setenv("GODEBUG", goDebug); err != nil {
		tls13ok = false
	}

	dlog.Init("dnscrypt-proxy", dlog.SeverityNotice, "DAEMON")

	app := &App{}
	app.proxy = dnscrypt.NewProxy()

	emptyStr := ""

	if err := dnscrypt.ConfigLoad(&app.proxy, &emptyStr, configFile); err != nil {
		dlog.Fatal(err)
	}

	dlog.Noticef("dnscrypt-proxy %s", AppVersion)

	if !tls13ok {
		dlog.Warn("Failed to initialize TLS 1.3 support")
	}

	return app
}

func (app *App) Run(cloakCallback CloakCallback) {
	go func() {
		<-app.proxy.ReadyCallback
		cloakCallback.ProxyReady()
	}()

	debug.SetGCPercent(10)

	go func() {
		for t := range time.NewTicker(5 * time.Second).C {
			_ = t
			debug.FreeOSMemory()
		}
	}()

	app.start()
}

func (app *App) start() error {
	proxy := &app.proxy
	if err := initPluginsGlobals(proxy.GetPluginsGlobals(), proxy); err != nil {
		dlog.Fatal(err)
	}
	app.quit = make(chan bool)
	app.wg.Add(1)
	app.appMain(proxy)
	return nil
}

func (app *App) appMain(proxy *dnscrypt.Proxy) {
	proxy.StartProxy()
	<-app.quit
	proxy.StopProxy()
	dlog.Notice("Quit signal received...")
	app.wg.Done()
}

func (app *App) Stop() error {
	dlog.Notice("Stopped.")
	app.quit <- true
	app.wg.Wait()
	return nil
}
