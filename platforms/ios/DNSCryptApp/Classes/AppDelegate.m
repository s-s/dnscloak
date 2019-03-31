#import "AppDelegate.h"
#import "MainViewController.h"
#import "Migrator.h"

@implementation AppDelegate

- (BOOL)application:(UIApplication*)application didFinishLaunchingWithOptions:(NSDictionary*)launchOptions
{
    [Migrator preflightCheck];
    [Migrator resetLockPermissions];
    [Migrator migrateDisconnectOnSleep];
    [Migrator migrateConnectOnDemand];
    
    self.viewController = [[MainViewController alloc] init];
    
    self.viewController.view.backgroundColor = [UIColor darkGrayColor];
    self.viewController.webView.scrollView.backgroundColor = [UIColor darkGrayColor];
    self.viewController.webView.backgroundColor = [UIColor darkGrayColor];
    
    return [super application:application didFinishLaunchingWithOptions:launchOptions];
}



@end
