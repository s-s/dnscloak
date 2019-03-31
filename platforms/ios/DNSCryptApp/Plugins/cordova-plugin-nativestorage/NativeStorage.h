#import <UIKit/UIKit.h>
#import <Cordova/CDVPlugin.h>
@interface NativeStorage : CDVPlugin

- (void) initWithSuiteName: (CDVInvokedUrlCommand*) command;

- (void) remove: (CDVInvokedUrlCommand*) command;
- (void) clear: (CDVInvokedUrlCommand*) command;

- (void) putBoolean: (CDVInvokedUrlCommand*) command;
- (void) getBoolean: (CDVInvokedUrlCommand*) command;

- (void) putInt: (CDVInvokedUrlCommand*) command;
- (void) getInt: (CDVInvokedUrlCommand*) command;

- (void) putDouble: (CDVInvokedUrlCommand*) command;
- (void) getDouble: (CDVInvokedUrlCommand*) command;

- (void) putString: (CDVInvokedUrlCommand*) command;
- (void) getString: (CDVInvokedUrlCommand*) command;

- (void) setItem: (CDVInvokedUrlCommand*) command;
- (void) getItem: (CDVInvokedUrlCommand*) command;

- (void) keys: (CDVInvokedUrlCommand*) command;


@end
