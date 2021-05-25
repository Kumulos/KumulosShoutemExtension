
package com.kumulos.android.shoutem;

import android.app.PendingIntent;
import android.content.Intent;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.google.android.gms.location.FusedLocationProviderClient;
import com.google.android.gms.location.LocationRequest;
import com.google.android.gms.location.LocationServices;
import com.kumulos.android.Kumulos;

public class KumulosShoutemModule extends ReactContextBaseJavaModule {

    private static final long LOC_UPDATE_MS = 3 * 60000;
    private static final long LOC_FASTEST_MS = 30000;
    private static final long LOC_MAX_WAIT_MS = 5 * 60000;

    private final ReactApplicationContext reactContext;

    public KumulosShoutemModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
    }

    @Override
    public String getName() {
        return "KumulosShoutem";
    }

    @ReactMethod
    public void startLocationTracking() {
        FusedLocationProviderClient client = LocationServices.getFusedLocationProviderClient(reactContext);

        LocationRequest request = new LocationRequest();
        request.setInterval(LOC_UPDATE_MS);
        request.setFastestInterval(LOC_FASTEST_MS);
        request.setMaxWaitTime(LOC_MAX_WAIT_MS);
        request.setPriority(LocationRequest.PRIORITY_BALANCED_POWER_ACCURACY);

        Intent intent = new Intent(reactContext, LocationReceiver.class);
        intent.setAction(LocationReceiver.ACTION_PROCESS_UPDATE);
        PendingIntent pendingIntent = PendingIntent.getBroadcast(reactContext, 0, intent, PendingIntent.FLAG_UPDATE_CURRENT);

        try {
            client.requestLocationUpdates(request, pendingIntent);
        } catch (SecurityException e) {
            e.printStackTrace();
        }
    }
}