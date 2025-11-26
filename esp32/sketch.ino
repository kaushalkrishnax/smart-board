#include <WiFi.h>
#include <ArduinoJson.h>
#include <WebSocketsServer.h>
#include <SPIFFS.h>
#include <FS.h>

const char* ssid = "SmartBoard";
const char* password = "12345678";

String validToken = "ESP-SECRET";

int relayPins[] = {5, 18};
const int totalSwitches = sizeof(relayPins) / sizeof(relayPins[0]);

WebSocketsServer ws(81);
StaticJsonDocument<512> switches;

void saveSwitches() {
  File f = SPIFFS.open("/switches.json", "w");
  serializeJson(switches, f);
  f.close();
}

void loadSwitches() {
  SPIFFS.begin(true);
  if (!SPIFFS.exists("/switches.json")) {
    switches["switches"] = JsonArray();
    {
      JsonObject a = switches["switches"].add<JsonObject>();
      a["id"] = 1;
      a["state"] = "OFF";
    }
    {
      JsonObject b = switches["switches"].add<JsonObject>();
      b["id"] = 2;
      b["state"] = "OFF";
    }
    saveSwitches();
    return;
  }
  File f = SPIFFS.open("/switches.json", "r");
  deserializeJson(switches, f);
  f.close();
}

void broadcastSwitchState() {
  int n = switches["switches"].size();
  int m = totalSwitches;
  int k = n < m ? n : m;
  for (int i = 0; i < k; i++) {
    String st = switches["switches"][i]["state"];
    digitalWrite(relayPins[i], st == "ON" ? LOW : HIGH);
  }
  StaticJsonDocument<512> packet;
  packet["type"] = "switches";
  packet["switches"] = switches["switches"];
  String json;
  serializeJson(packet, json);
  ws.broadcastTXT(json);
}

void webSocketEvent(uint8_t client, WStype_t type, uint8_t *payload, size_t len) {
  if (type == WStype_CONNECTED) {
    broadcastSwitchState();
    return;
  }
  if (type != WStype_TEXT) return;

  StaticJsonDocument<512> data;
  deserializeJson(data, payload);
  String t = data["type"];

  if (t == "auth") {
    if (data["token"] != validToken) {
      ws.sendTXT(client, "{\"type\":\"error\",\"msg\":\"Invalid token\"}");
      ws.disconnect(client);
      return;
    }
    ws.sendTXT(client, "{\"type\":\"auth\",\"msg\":\"OK\"}");
    return;
  }

  if (data["token"] != validToken) {
    ws.sendTXT(client, "{\"type\":\"error\",\"msg\":\"Unauthorized\"}");
    return;
  }

  if (t == "toggle") {
    int id = data["id"];
    String st = data["state"];
    for (JsonObject sw : switches["switches"].as<JsonArray>()) {
      if (sw["id"] == id) sw["state"] = st;
    }
    saveSwitches();
    broadcastSwitchState();
  }

  if (t == "all") {
    String v = data["state"];
    for (JsonObject sw : switches["switches"].as<JsonArray>()) {
      sw["state"] = v;
    }
    saveSwitches();
    broadcastSwitchState();
  }

  if (t == "switches") {
    switches["switches"] = data["switches"];
    saveSwitches();
    broadcastSwitchState();
  }
}

void setup() {
  Serial.begin(115200);
  loadSwitches();
  for (int i = 0; i < totalSwitches; i++) {
    pinMode(relayPins[i], OUTPUT);
    digitalWrite(relayPins[i], HIGH);
  }
  WiFi.softAP(ssid, password);
  ws.begin();
  ws.onEvent(webSocketEvent);
}

void loop() {
  ws.loop();
}