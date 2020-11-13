package com.kumulos.android.shoutem;

import com.google.firebase.messaging.RemoteMessage;
import com.kumulos.android.FirebaseMessagingService;

import org.json.JSONException;
import org.json.JSONObject;

import java.util.Map;

public class KumulosShoutemFcmService extends FirebaseMessagingService {

    @Override
    public void onNewToken(String token) {
        super.onNewToken(token);

        if (classExists("com.dieam.reactnativepushnotification.modules.RNPushNotificationListenerService")) {
            com.dieam.reactnativepushnotification.modules.RNPushNotificationListenerService otherSvc = new com.dieam.reactnativepushnotification.modules.RNPushNotificationListenerService();
            otherSvc.onNewToken(token);
        }
    }

    @Override
    public void onMessageReceived(RemoteMessage remoteMessage) {
        if (isAKumulosPush(remoteMessage)) {
            super.onMessageReceived(remoteMessage);
        }
        else if (classExists("com.dieam.reactnativepushnotification.modules.RNPushNotificationListenerService")) {
            com.dieam.reactnativepushnotification.modules.RNPushNotificationListenerService otherSvc = new com.dieam.reactnativepushnotification.modules.RNPushNotificationListenerService();
            otherSvc.onMessageReceived(remoteMessage);
        }
    }

    private boolean isAKumulosPush(RemoteMessage remoteMessage) {
        Map<String, String> bundle = remoteMessage.getData();
        if (!bundle.containsKey("custom")) {
            return false;
        }

        String customStr = bundle.get("custom");

        JSONObject data;
        try {
            JSONObject custom = new JSONObject(customStr);

            data = custom.optJSONObject("a");
            return data.has("k.message");
        } catch (JSONException e) {
            return false;
        }
    }

    private boolean classExists(String name) {
        try {
            Class.forName(name);
            return true;
        } catch (ClassNotFoundException e) {
            return false;
        }
    }
}
