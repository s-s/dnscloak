/* Copyright (C) 2019 Sergey Smirnov
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

#import "DNSCryptThread.h"

NS_ASSUME_NONNULL_BEGIN

NSString *const kDNSCryptProxyReady = @"DNSCryptProxyReady";

@interface DNSCryptThread ()
@end

@implementation DNSCryptThread
- (instancetype)init {
    return [self initWithArguments:nil];
}

- (instancetype)initWithArguments:(nullable NSArray<NSString *> *)arguments {
    self = [super init];
    if (!self)
        return nil;
    
    _dnsApp = DnscryptproxyMain(arguments[0]);
    
    self.name = @"DNSCloak";
    
    return self;
}

- (void)main {
    [_dnsApp run:self];
}

- (void) proxyReady {
    [[NSNotificationCenter defaultCenter] postNotificationName:kDNSCryptProxyReady object:self];
}

- (DnscryptproxyApp *)dnsApp {
    return _dnsApp;
}

- (void)closeIdleConnections {
    [_dnsApp closeIdleConnections];
}

- (void)refreshServersInfo {
    [_dnsApp refreshServersInfo];
}

- (void)stopApp {
    [_dnsApp stop:nil];
}

- (void)logDebug:(NSString *)str {
    [_dnsApp logDebug:str];
}

- (void)logInfo:(NSString *)str {
    [_dnsApp logInfo:str];
}

- (void)logNotice:(NSString *)str {
    [_dnsApp logNotice:str];
}

- (void)logWarn:(NSString *)str {
    [_dnsApp logWarn:str];
}

- (void)logError:(NSString *)str {
    [_dnsApp logError:str];
}

- (void)logCritical:(NSString *)str {
    [_dnsApp logCritical:str];
}

- (void)logFatal:(NSString *)str {
    [_dnsApp logFatal:str];
}
@end

NS_ASSUME_NONNULL_END
