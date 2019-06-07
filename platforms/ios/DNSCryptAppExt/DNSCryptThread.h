/* Copyright (C) 2019 Sergey Smirnov
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

#import <Foundation/Foundation.h>
#import <Dnscryptproxy/Dnscryptproxy.h>

NS_ASSUME_NONNULL_BEGIN

extern NSString *const kDNSCryptProxyReady;

NS_SWIFT_NAME(DNSCryptThread)
@interface DNSCryptThread : NSThread <DnscryptproxyCloakCallback>
- (instancetype)initWithArguments:(nullable NSArray<NSString *> *)arguments NS_DESIGNATED_INITIALIZER;
- (void)proxyReady;

- (void)stopApp;
- (void)closeIdleConnections;
- (void)refreshServersInfo;

- (void)logDebug:(NSString *)str;
- (void)logInfo:(NSString *)str;
- (void)logNotice:(NSString *)str;
- (void)logWarn:(NSString *)str;
- (void)logError:(NSString *)str;
- (void)logCritical:(NSString *)str;
- (void)logFatal:(NSString *)str;

@property (nonatomic, copy, null_resettable) DnscryptproxyApp *dnsApp;

@end

NS_ASSUME_NONNULL_END
