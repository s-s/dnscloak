/* Copyright (C) 2019 Sergey Smirnov
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

#import "Migrator.h"
#import <Dnscryptproxy/Dnscryptproxy.h>

@import NetworkExtension;

NS_ASSUME_NONNULL_BEGIN

@interface Migrator ()
@end

@implementation Migrator

+ (void) preflightCheck {
    @autoreleasepool {
        NSFileManager *fileManager = [NSFileManager defaultManager];
        NSURL *containerURL = [fileManager containerURLForSecurityApplicationGroupIdentifier:@"group.org.techcultivation.dnscloak"];
        
        NSString *dnscryptPath = [[containerURL path] stringByAppendingPathComponent:@"dnscrypt"];
        if(![fileManager fileExistsAtPath:dnscryptPath]) {
            NSNumber* octal700 = [NSNumber numberWithUnsignedLong:0700] ;
            NSDictionary* attributes = [NSDictionary dictionaryWithObjectsAndKeys:
                                        octal700, NSFilePosixPermissions,
                                        nil] ;
            
            [fileManager createDirectoryAtPath:dnscryptPath withIntermediateDirectories:YES attributes:attributes error:NULL];
        }
        
        NSString *logsPath = [[containerURL path] stringByAppendingPathComponent:@"dnscrypt/logs"];
        if(![fileManager fileExistsAtPath:logsPath]) {
            NSNumber* octal700 = [NSNumber numberWithUnsignedLong:0700] ;
            NSDictionary* attributes = [NSDictionary dictionaryWithObjectsAndKeys:
                                        octal700, NSFilePosixPermissions,
                                        nil] ;
            
            [fileManager createDirectoryAtPath:logsPath withIntermediateDirectories:YES attributes:attributes error:NULL];
        }
        
        NSString *resolversPath = [[containerURL path] stringByAppendingPathComponent:@"dnscrypt/resolvers"];
        if(![fileManager fileExistsAtPath:resolversPath]) {
            NSNumber* octal700 = [NSNumber numberWithUnsignedLong:0700] ;
            NSDictionary* attributes = [NSDictionary dictionaryWithObjectsAndKeys:
                                        octal700, NSFilePosixPermissions,
                                        nil] ;
            
            [fileManager createDirectoryAtPath:resolversPath withIntermediateDirectories:YES attributes:attributes error:NULL];
        }
        
        //make default config
        if(![fileManager fileExistsAtPath:[[containerURL path] stringByAppendingPathComponent:@"dnscrypt/dnscrypt.toml"]]) {
            NSString *str = [NSString stringWithFormat:@"listen_addresses = ['127.0.0.1:53', '[::1]:53']\n"
                             "ipv4_servers = true\n"
                             "ipv6_servers = true\n"
                             "max_clients = 250\n"
                             "dnscrypt_servers = true\n"
                             "doh_servers = true\n"
                             "require_dnssec = false\n"
                             "require_nolog = false\n"
                             "require_nofilter = false\n"
                             "force_tcp = false\n"
                             "tls_disable_session_tickets = false\n"
                             "dnscrypt_ephemeral_keys = false\n"
                             "timeout = 2500\n"
                             "cert_refresh_delay = 240\n"
                             "block_ipv6 = false\n"
                             "cache = true\n"
                             "cache_size = 256\n"
                             "cache_min_ttl = 600\n"
                             "cache_max_ttl = 86400\n"
                             "cache_neg_ttl = 60\n"
                             "fallback_resolver = '9.9.9.9:53'\n"
                             "ignore_system_dns = false\n"
                             "log_files_max_size = 10\n"
                             "log_files_max_age = 7\n"
                             "log_files_max_backups = 1\n"
                             
                             "max_workers = 25\n"
                             "netprobe_timeout = 0\n"
                             
                             "[sources.'public-resolvers']\n"
                             "url = 'https://raw.githubusercontent.com/DNSCrypt/dnscrypt-resolvers/master/v2/public-resolvers.md'\n"
                             "minisign_key = 'RWQf6LRCGA9i53mlYecO4IzT51TGPpvWucNSCh1CBM0QTaLn73Y7GFO3'\n"
                             "cache_file = '%@'\n"
                             "format = 'v2'\n"
                             "refresh_delay = 72\n"
                             "prefix = ''\n",
                             [[containerURL path] stringByAppendingPathComponent:@"dnscrypt/resolvers/public-resolvers.md"]
                             ];
            [str writeToFile:[[containerURL path] stringByAppendingPathComponent:@"dnscrypt/dnscrypt.toml"] atomically:YES encoding:NSUTF8StringEncoding error:nil];
        } else { //already exists
            NSString *content = [NSString stringWithContentsOfFile:[[containerURL path] stringByAppendingPathComponent:@"dnscrypt/dnscrypt.toml"] encoding:NSUTF8StringEncoding error:nil];
            BOOL modified = NO;
            
            NSString *modifiedString = content;
            
            if ([modifiedString rangeOfString:@"max_workers" options:NSRegularExpressionSearch].location == NSNotFound) {
                modifiedString = [@"max_workers = 25\n" stringByAppendingString:modifiedString];
                modified = YES;
            }
            
            if ([modifiedString rangeOfString:@"netprobe_timeout" options:NSRegularExpressionSearch].location == NSNotFound) {
                modifiedString = [@"netprobe_timeout = 0\n" stringByAppendingString:modifiedString];
                modified = YES;
            }
            
            if ([modifiedString rangeOfString:@"listen_addresses\\s*=\\s*\\[[^\\[\\]]*['\"]\\[::1\\]:53['\"][^\\[\\]]*\\]" options:NSRegularExpressionSearch].location == NSNotFound) {
                NSRegularExpression *regex = [NSRegularExpression regularExpressionWithPattern:@"(listen_addresses\\s*=\\s*\\[[^\\[\\]]*['\"]127.0.0.1:53['\"])([^\\[\\]]*\\])" options:NSRegularExpressionCaseInsensitive error:nil];
                modifiedString = [regex stringByReplacingMatchesInString:modifiedString
                                                                 options:0
                                                                   range:NSMakeRange(0, [modifiedString length])
                                                            withTemplate:@"$1, '[::1]:53'$2"];
                modified = YES;
            }
            
            if ([modifiedString rangeOfString:@"forwarding_rules\\s*=\\s*false" options:NSRegularExpressionSearch].location != NSNotFound) {
                NSRegularExpression *regex = [NSRegularExpression regularExpressionWithPattern:@"forwarding_rules\\s*=\\s*false" options:NSRegularExpressionCaseInsensitive error:nil];
                modifiedString = [regex stringByReplacingMatchesInString:modifiedString
                                                                 options:0
                                                                   range:NSMakeRange(0, [modifiedString length])
                                                            withTemplate:@""];
                modified = YES;
            }
            
            NSRegularExpression *regexPaths = [NSRegularExpression regularExpressionWithPattern:@"\"(/[^\"]+?/dnscrypt)/" options:NSRegularExpressionCaseInsensitive error:nil];
            
            NSArray *matches = [regexPaths matchesInString:content options:0 range:NSMakeRange(0, [content length])];
            NSString *foundPath;
            
            for (NSTextCheckingResult *result in matches) {
                foundPath = [content substringWithRange:[result rangeAtIndex:1]];
                if(![fileManager fileExistsAtPath:foundPath]) {
                    modifiedString = [modifiedString stringByReplacingOccurrencesOfString:foundPath withString:dnscryptPath];
                    modified = YES;
                }
            }
            
            
            if (modified) {
                [modifiedString writeToFile:[[containerURL path] stringByAppendingPathComponent:@"dnscrypt/dnscrypt.toml"] atomically:YES encoding:NSUTF8StringEncoding error:nil];
            }
        }
        
        if([fileManager fileExistsAtPath:[[containerURL path] stringByAppendingPathComponent:@"dnscrypt/dnscrypt-user.toml"]]) {
            NSString *content = [NSString stringWithContentsOfFile:[[containerURL path] stringByAppendingPathComponent:@"dnscrypt/dnscrypt-user.toml"] encoding:NSUTF8StringEncoding error:nil];
            BOOL modified = NO;
            
            NSString *modifiedString = content;
            
            if ([modifiedString rangeOfString:@"listen_addresses\\s*=\\s*\\[[^\\[\\]]*['\"]\\[::1\\]:53['\"][^\\[\\]]*\\]" options:NSRegularExpressionSearch].location == NSNotFound) {
                NSRegularExpression *regex = [NSRegularExpression regularExpressionWithPattern:@"(listen_addresses\\s*=\\s*\\[[^\\[\\]]*['\"]127.0.0.1:53['\"])([^\\[\\]]*\\])" options:NSRegularExpressionCaseInsensitive error:nil];
                modifiedString = [regex stringByReplacingMatchesInString:modifiedString
                                                                 options:0
                                                                   range:NSMakeRange(0, [modifiedString length])
                                                            withTemplate:@"$1, '[::1]:53'$2"];
                modified = YES;
            }
            
            if (modified) {
                [modifiedString writeToFile:[[containerURL path] stringByAppendingPathComponent:@"dnscrypt/dnscrypt-user.toml"] atomically:YES encoding:NSUTF8StringEncoding error:nil];
            }
        }
        
        if([fileManager fileExistsAtPath:[[containerURL path] stringByAppendingPathComponent:@"dnscrypt/blacklist.txt"]] && ![fileManager fileExistsAtPath:[[containerURL path] stringByAppendingPathComponent:@"dnscrypt/blacklist.txt.prefixes"]]) {
            DnscryptproxyFillPatternlistTrees([[containerURL path] stringByAppendingPathComponent:@"dnscrypt/blacklist.txt"], nil);
        }
        
        if([fileManager fileExistsAtPath:[[containerURL path] stringByAppendingPathComponent:@"dnscrypt/whitelist.txt"]] && ![fileManager fileExistsAtPath:[[containerURL path] stringByAppendingPathComponent:@"dnscrypt/whitelist.txt.prefixes"]]) {
            DnscryptproxyFillPatternlistTrees([[containerURL path] stringByAppendingPathComponent:@"dnscrypt/whitelist.txt"], nil);
        }
        
        if([fileManager fileExistsAtPath:[[containerURL path] stringByAppendingPathComponent:@"dnscrypt/ip_blacklist.txt"]] && ![fileManager fileExistsAtPath:[[containerURL path] stringByAppendingPathComponent:@"dnscrypt/ip_blacklist.txt.prefixes"]]) {
            DnscryptproxyFillIpBlacklistTrees([[containerURL path] stringByAppendingPathComponent:@"dnscrypt/ip_blacklist.txt"], nil);
        }
    }
}

+ (void) resetLockPermissions {
    @autoreleasepool {
        NSFileManager *fileManager = [NSFileManager defaultManager];
        NSURL *containerURL = [fileManager containerURLForSecurityApplicationGroupIdentifier:@"group.org.techcultivation.dnscloak"];
        
        NSString *prefsFilePath = [[containerURL path] stringByAppendingPathComponent:[NSString stringWithFormat:@"Library/Preferences/%@.plist", @"group.org.techcultivation.dnscloak"]];
        if ([fileManager fileExistsAtPath:prefsFilePath]) {
            NSMutableDictionary *attr = [[fileManager attributesOfItemAtPath:prefsFilePath error:nil] mutableCopy];
            [attr setObject:NSFileProtectionNone forKey:NSFileProtectionKey];
            [fileManager setAttributes:attr ofItemAtPath:prefsFilePath error:nil];
        }
        
        // fix permissions for files
        NSArray *keys = [NSArray arrayWithObject:NSURLIsDirectoryKey];
        NSURL *mainDir = [containerURL URLByAppendingPathComponent:@"dnscrypt"];
        NSDirectoryEnumerator *enumerator = [fileManager
                                             enumeratorAtURL:mainDir
                                             includingPropertiesForKeys:keys
                                             options:0
                                             errorHandler:^(NSURL *url, NSError *error) {
                                                 return YES;
                                             }];
        
        for (NSURL *url in enumerator) {
            NSError *error;
            NSNumber *isDirectory = nil;
            if (! [url getResourceValue:&isDirectory forKey:NSURLIsDirectoryKey error:&error]) {
                // handle error
            } else if (! [isDirectory boolValue]) {
                NSMutableDictionary *attr = [[fileManager attributesOfItemAtPath:[url path] error:nil] mutableCopy];
                [attr setObject:NSFileProtectionNone forKey:NSFileProtectionKey];
                [fileManager setAttributes:attr ofItemAtPath:[url path] error:nil];
            }
        }
    }
}

+ (void) migrateDisconnectOnSleep {
    NSUserDefaults *defs = [[NSUserDefaults alloc] initWithSuiteName: @"group.org.techcultivation.dnscloak"];
    
    if (![defs boolForKey:@"fixSleep"]) {
        [NETunnelProviderManager loadAllFromPreferencesWithCompletionHandler:^(NSArray *managers, NSError *error) {
            for (NETunnelProviderManager *m in managers)  {
                m.protocolConfiguration.disconnectOnSleep = NO;
                [m saveToPreferencesWithCompletionHandler:^(NSError *error){ }];
            }
        }];
        [defs setBool:YES forKey:@"fixSleep"];
    }
}

+ (void) migrateConnectOnDemand {
    NSUserDefaults *defs = [[NSUserDefaults alloc] initWithSuiteName: @"group.org.techcultivation.dnscloak"];
    if (![defs boolForKey:@"migrateConnectOnDemand"]) {
        [NETunnelProviderManager loadAllFromPreferencesWithCompletionHandler:^(NSArray *managers, NSError *error) {
            for (NETunnelProviderManager *m in managers)  {
                [defs setBool:m.isOnDemandEnabled forKey:@"connectOnDemand"];
            }
        }];
        [defs setBool:YES forKey:@"migrateConnectOnDemand"];
    }
}

@end

NS_ASSUME_NONNULL_END
