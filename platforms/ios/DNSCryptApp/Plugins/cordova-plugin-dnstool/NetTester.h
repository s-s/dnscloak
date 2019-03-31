#import <Foundation/Foundation.h>

#define NET_TESTER_NO_CONN 0
#define NET_TESTER_IPV4_CONN 1
#define NET_TESTER_IPV6_CONN 2
#define NET_TESTER_DUAL_CONN 3

@interface NetTester : NSObject
+ (NSInteger) status;
@end
