package com.smart.board.plugins.smartboard;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.util.List;

@CapacitorPlugin(name = "SmartBoard")
public class SmartBoardPlugin extends Plugin {

    private SmartBoard implementation;

    @Override
    public void load() {
        implementation = new SmartBoard(getContext());
        implementation.setEventCallback((eventName, data) -> {
            JSObject ret = new JSObject();
            ret.put("data", data);
            notifyListeners(eventName, ret);
        });
    }

    @Override
    protected void handleOnDestroy() {
        implementation.cleanup();
    }

    @PluginMethod
    public void setConfig(PluginCall call) {
        String url = call.getString("url");
        String token = call.getString("token");
        JSArray switches = call.getArray("switches", new JSArray());

        String picovoiceAccessKey = call.getString("picovoiceAccessKey");
        String picovoiceModel = call.getString("picovoiceModel");

        implementation.setConfig(url, token, switches.toString(), picovoiceAccessKey, picovoiceModel);
        call.resolve();
    }

    @PluginMethod
    public void getConfig(PluginCall call) {
        SmartBoard.Config config = implementation.getConfig();
        JSObject ret = new JSObject();

        ret.put("url", config.url);
        ret.put("token", config.token);
        try {
            ret.put("switches", new JSArray(config.switches));
        } catch (Exception e) {
            ret.put("switches", new JSArray());
        }

        ret.put("picovoiceAccessKey", config.picovoiceAccessKey);
        ret.put("picovoiceModel", config.picovoiceModel);

        call.resolve(ret);
    }

    @PluginMethod
    public void startWebSocket(PluginCall call) {
        implementation.startWebSocket();
        call.resolve();
    }

    @PluginMethod
    public void stopWebSocket(PluginCall call) {
        implementation.stopWebSocket();
        call.resolve();
    }

    @PluginMethod
    public void sendAction(PluginCall call) {
        JSObject data = call.getData();
        implementation.sendAction(data.toString());
        call.resolve();
    }

    @PluginMethod
    public void startAutomationService(PluginCall call) {
        JSArray rules = call.getArray("rules", new JSArray());
        implementation.startAutomationService(rules.toString());
        call.resolve();
    }

    @PluginMethod
    public void getAutomations(PluginCall call) {
        String jsonRules = implementation.getAutomations();
        JSObject ret = new JSObject();
        try {
            ret.put("rules", new JSArray(jsonRules));
        } catch (Exception e) {
            ret.put("rules", new JSArray());
        }
        call.resolve(ret);
    }

    @PluginMethod
    public void setAutomations(PluginCall call) {
        JSArray rules = call.getArray("rules");
        if (rules == null) {
            call.reject("Rules array required");
            return;
        }

        String jsonRules = rules.toString();
        implementation.updateAutomations(rules.toString());
        call.resolve();
    }

    @PluginMethod
    public void requestBatteryOpt(PluginCall call) {
        implementation.requestBatteryOpt(getActivity());
        call.resolve();
    }

    @PluginMethod
    public void getPicovoiceModels(PluginCall call) {
        List<String> models = implementation.getPicovoiceModels();
        JSObject ret = new JSObject();
        JSArray jsonArray = new JSArray();
        
        for (String model : models) {
            jsonArray.put(model);
        }

        ret.put("models", jsonArray);
        call.resolve(ret);
    }
}