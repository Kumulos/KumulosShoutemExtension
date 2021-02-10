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

  self.nearBee = [NearBee initNearBee];
  [self.nearBee setDelegate:self];
  [self.nearBee startScanning];
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

#pragma mark - NearBee delegates

- (void)didFindBeacons:(NSArray<NearBeeBeacon *> * _Nonnull)beacons {
  for (NearBeeBeacon *beacon in beacons) {
    if (!beacon.eddystoneUID) {
      continue;
    }

    NSString *namespace = [beacon.eddystoneUID substringWithRange:NSMakeRange(0, 20)];
    NSString *instance = [beacon.eddystoneUID substringFromIndex:20];
    [Kumulos.shared trackEventImmediately:@"k.engage.beaconEnteredProximity"
                           withProperties:@{
                                            @"type": @(2),
                                            @"namespace": namespace,
                                            @"instance": instance
                                            }];
  }
}

- (void)didLoseBeacons:(NSArray<NearBeeBeacon *> * _Nonnull)beacons {
  // Noop
}

- (void)didThrowError:(NSError * _Nonnull)error {
  NSLog(@"NearBee error: %@", error);
}

- (void)didUpdateBeacons:(NSArray<NearBeeBeacon *> * _Nonnull)beacons {
  // Noop
}

- (void)didUpdateState:(enum NearBeeState)state {
  // Noop
}
`;

module.exports = {
  ios: {
    podDeps: `
    pod 'NearBee', '0.2.3'
`,
    delegateBody: `
${iOSLocationDelegateCode}
`,
    findDelegateLine: `@implementation AppDelegate`,
    replaceDelegateLine: `
@interface AppDelegate () <CLLocationManagerDelegate, NearBeeDelegate>

@property (nonatomic, strong) CLLocationManager *lm;
@property (nonatomic, strong) NearBee *nearBee;

@end

@implementation AppDelegate
`,
    findDidLaunch: `return YES;`,
    delegateImports: `
@import CoreLocation;
#import <KumulosReactNative/KumulosReactNative.h>
#import <NearBee/NearBee-Swift.h>
`,
  },
  android: {},
};
