#import <Capacitor/Capacitor.h>

CAP_PLUGIN(HttpBridgePlugin, "HttpBridge",
    CAP_PLUGIN_METHOD(request, CAPPluginReturnPromise);
)
