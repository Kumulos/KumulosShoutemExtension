const iOSLocationDelegateCode = `
#pragma mark - Location handling
- (void) setupLocationMonitoring:(NSDictionary*) launchOptions {
  self.lm = [CLLocationManager new];
  self.lm.allowsBackgroundLocationUpdates = YES;
  self.lm.pausesLocationUpdatesAutomatically = NO;
  [self.lm setDelegate:self];

  CLAuthorizationStatus status = [CLLocationManager authorizationStatus];

  if (kCLAuthorizationStatusNotDetermined == status) {
    if (@available(iOS 13.0, *)) {
      [self.lm requestWhenInUseAuthorization];
    } else {
      [self.lm requestAlwaysAuthorization];
    }
  }
  else if (kCLAuthorizationStatusAuthorizedWhenInUse == status) {
    [self.lm requestAlwaysAuthorization];
  }
  else if (kCLAuthorizationStatusAuthorizedAlways == status) {
    [self startLocationMonitoring];
  }
}

- (void) startLocationMonitoring {
  if (CLLocationManager.significantLocationChangeMonitoringAvailable) {
    [self.lm startMonitoringSignificantLocationChanges];
  }
}

- (void)locationManager:(CLLocationManager *)manager didChangeAuthorizationStatus:(CLAuthorizationStatus)status {
  if (kCLAuthorizationStatusAuthorizedWhenInUse == status) {
    [self.lm requestAlwaysAuthorization];
  }
  else if (kCLAuthorizationStatusAuthorizedAlways == status) {
    [self startLocationMonitoring];
  }
  else {
    if (CLLocationManager.significantLocationChangeMonitoringAvailable) {
      [self.lm stopMonitoringSignificantLocationChanges];
    }
  }
}

- (void)locationManager:(CLLocationManager *)manager didUpdateLocations:(NSArray<CLLocation *> *)locations {
  if (Kumulos.shared) {
    for (CLLocation* loc in locations) {
      [Kumulos.shared sendLocationUpdate:loc];
    }
  }
}
`;

module.exports = {
  ios: {
    delegateBody: `
${iOSLocationDelegateCode}
`,
    findDelegateLine: `@implementation AppDelegate`,
    replaceDelegateLine: `
@interface AppDelegate () <CLLocationManagerDelegate>

@property (nonatomic, strong) CLLocationManager *lm;

@end

@implementation AppDelegate
`,
    findDidLaunch: `return YES;`,
    delegateImports: `
@import CoreLocation;
#import <KumulosReactNative/KumulosReactNative.h>
`,
  },
  android: {},
};
