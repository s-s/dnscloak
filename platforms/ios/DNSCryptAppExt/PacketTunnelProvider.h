/* Copyright (C) 2019 Sergey Smirnov
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

#import "DNSCryptThread.h"
#import "Reachability.h"

@import NetworkExtension;

@interface PacketTunnelProvider : NEPacketTunnelProvider

@property (nonatomic, copy, null_resettable) DNSCryptThread *dns;
@property (nonatomic, copy, null_resettable) Reachability *reach;
@property (nonatomic, copy, null_resettable) NSDate *lastForcedResolversCheck;
@end
