/* Copyright (C) 2019 Sergey Smirnov
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

#ifndef DNSCloakMigrator_h
#define DNSCloakMigrator_h

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

NS_SWIFT_NAME(DNSCloakMigrator)
@interface Migrator : NSObject
+ (void) preflightCheck;
+ (void) resetLockPermissions;
+ (void) migrateDisconnectOnSleep;
+ (void) migrateConnectOnDemand;
@end

NS_ASSUME_NONNULL_END

#endif /* DNSCloakMigrator_h */
