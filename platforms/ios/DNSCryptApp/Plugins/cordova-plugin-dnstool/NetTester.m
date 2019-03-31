#import "NetTester.h"
#include <stdio.h>
#include <sys/types.h>
#include <sys/socket.h>
#include <ifaddrs.h>
#include <net/if.h>
#include <netdb.h>

@implementation NetTester

+ (NSInteger) status {
    NSString *addrStr;
    NSString *interfaceStr;
    
    BOOL hasIPv4 = NO;
    BOOL hasIPv6 = NO;
    
    struct ifaddrs *allInterfaces;
    
    if (getifaddrs(&allInterfaces) == 0) {
        struct ifaddrs *interface;
        
        for (interface = allInterfaces; interface != NULL; interface = interface->ifa_next) {
            unsigned int flags = interface->ifa_flags;
            struct sockaddr *addr = interface->ifa_addr;
            
            if ((flags & (IFF_UP|IFF_RUNNING|IFF_LOOPBACK)) == (IFF_UP|IFF_RUNNING)) {
                
                if (addr->sa_family == AF_INET || addr->sa_family == AF_INET6) {
                    char host[NI_MAXHOST];
                    getnameinfo(addr, addr->sa_len, host, sizeof(host), NULL, 0, NI_NUMERICHOST);
                    
                    addrStr = [NSString stringWithFormat:@"%s", host];
                    interfaceStr = [NSString stringWithUTF8String:interface->ifa_name];
                    
                    if ([interfaceStr hasPrefix:@"en"] || [interfaceStr hasPrefix:@"pdp_ip"]) {
                        if (addr->sa_family == AF_INET) {
                            if (!([addrStr hasPrefix:@"127."] || [addrStr hasPrefix:@"0."] || [addrStr hasPrefix:@"169.254."] || [addrStr hasPrefix:@"255."])) {
                                hasIPv4 = YES;
                            }
                        } else {
                            if (![addrStr hasPrefix:@"fe80:"]) {
                                hasIPv6 = YES;
                            }
                        }
                    }
                }
            }
        }
        
        freeifaddrs(allInterfaces);
    }
    
    if (hasIPv4 && hasIPv6) {
        return NET_TESTER_DUAL_CONN;
    } else if (hasIPv4) {
        return NET_TESTER_IPV4_CONN;
    } else if (hasIPv6) {
        return NET_TESTER_IPV6_CONN;
    } else {
        return NET_TESTER_NO_CONN;
    }
}

@end
