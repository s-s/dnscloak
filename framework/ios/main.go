/* Copyright (C) 2019 Sergey Smirnov
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

package dnscryptproxy

import (
	crypto_rand "crypto/rand"
	"encoding/binary"
	"fmt"
	"math/rand"
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
	proxy *dnscrypt.Proxy
	flags *dnscrypt.ConfigFlags
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

	seed := make([]byte, 8)
	crypto_rand.Read(seed)
	rand.Seed(int64(binary.LittleEndian.Uint64(seed[:])))

	dlog.Init("dnscrypt-proxy", dlog.SeverityNotice, "DAEMON")

	falsie := false
	npTimeout := 60
	flags := dnscrypt.ConfigFlags{}
	flags.List = &falsie
	flags.ListAll = &falsie
	flags.JSONOutput = &falsie
	flags.Check = &falsie
	flags.ConfigFile = &configFile
	flags.Child = &falsie
	flags.NetprobeTimeoutOverride = &npTimeout
	flags.ShowCerts = &falsie

	app := &App{
		flags: &flags,
	}
	app.proxy = dnscrypt.NewProxy()

	if err := dnscrypt.ConfigLoad(app.proxy, app.flags); err != nil {
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
	proxy := app.proxy
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
