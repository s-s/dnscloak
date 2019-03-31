#!/bin/bash

# Copyright (C) 2019 Sergey Smirnov
#
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at https://mozilla.org/MPL/2.0/. */

FORCE=0
VERBOSE=0
CACHEOFF=0

if [[ "$CORDOVA_CMDLINE" != "" ]]; then
  if [[ $CORDOVA_CMDLINE == *"--with-framework"* ]]; then
    FORCE=1
  fi

  if [[ $CORDOVA_CMDLINE == *"--with-gocache-off"* ]]; then
    CACHEOFF=1
  fi

  if [[ $CORDOVA_CMDLINE == *"--verbose"* ]]; then
    VERBOSE=1
  fi
else
  while [[ "$1" != "" ]]; do
    case $1 in
      --force )             FORCE=1
                            ;;
      --verbose )           VERBOSE=1
                            ;;
      --with-gocache-off )  CACHEOFF=1
                            ;;
      * ) exit 1
    esac
    shift
  done
fi

if [[ "$CORDOVA_CMDLINE" != "" ]]; then
  PLATFORMPATH="`dirname \"$0\"`/../../platforms/ios/"
else
  PLATFORMPATH="`dirname \"$0\"`/../platforms/ios/"
fi

if [[ $FORCE != 1 && -d "${PLATFORMPATH}Dnscryptproxy.framework" ]]; then
  echo "Framework exists, skipping..."
  exit 0
fi

echo "Building Go framework"
cd "$PLATFORMPATH"

REPOROOT=$(pwd)

export GOPATH=$REPOROOT/.build
export PATH=$GOPATH/bin:$PATH

PKGPATH=$GOPATH/src/github.com/jedisct1/dnscrypt-proxy

export GOFLAGS="-ldflags=-s -ldflags=-w"

# always rebuild packages
if [[ $CACHEOFF == 1 ]]; then
  go clean -cache
fi

# if you want to use a custom built Go...
#export PATH=$GOPATH/bin:/path/to/your/custom/go/bin:$PATH

# verbose output
if [[ $VERBOSE == 1 ]]; then
  set -v
  GOMOBILE_FLAGS="-v"
fi

# create fresh build dir
rm -fr $GOPATH
mkdir -p $GOPATH

# clean up previous binary
rm -fr Dnscryptproxy.framework/

# fetch & init gomobile

# broken for Xcode 10.2, see https://github.com/golang/go/issues/31015
#go get golang.org/x/mobile/cmd/gomobile

# temporary workaround for Xcode 10.2
go get -d 'golang.org/x/mobile/cmd/gomobile'
cd $GOPATH/src/golang.org/x/mobile
git remote add ss-gomobile https://github.com/s-s/mobile.git
git fetch ss-gomobile --quiet
git checkout xcode-10-2 --quiet
cd $REPOROOT
go get 'golang.org/x/mobile/cmd/gomobile'


gomobile init

# fetch vanilla dnscrypt-proxy
go get -d 'github.com/jedisct1/dnscrypt-proxy'

# add some mobile-specific flavor
cd $PKGPATH
git remote add dnscloak https://github.com/s-s/dnscrypt-proxy.git
git fetch dnscloak --quiet
git checkout ios --quiet

# prepare dnscrypt-proxy sources
cd $PKGPATH/dnscrypt-proxy

# save version info
VERSION="$( sed '/AppVersion[[:space:]]*=/!d' main.go )"
if [[ $VERSION == "" ]]; then
  VERSION='AppVersion = "(unknown)"'
fi

# remove unused
rm main.go
rm *_linux.go
rm *_windows.go
rm privilege*.go

rm -rf ../vendor/github.com/kardianos/service

# wrap into package and remove some unnecessaries
sed -i -- 's/package main/package dnscrypt/g; s/AppVersion/""/g; s/proxy.dropPrivilege/\/\/proxy.dropPrivilege/' *.go

# build a framework
cd $REPOROOT

# copy files in-place
cp -R ../../framework/* $PKGPATH/dnscrypt-proxy

# save version info
cat >$PKGPATH/dnscrypt-proxy/ios/version.go <<EOS
package dnscryptproxy
const (
  ${VERSION}
)
EOS

# check & update deps if required
go get 'github.com/jedisct1/dnscrypt-proxy/dnscrypt-proxy/ios'

# make the binary
gomobile bind -target ios $GOMOBILE_FLAGS 'github.com/jedisct1/dnscrypt-proxy/dnscrypt-proxy/ios'

# clean up build artifacts
rm -fr $GOPATH
