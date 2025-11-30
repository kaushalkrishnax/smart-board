#include <WiFi.h>
#include <ArduinoJson.h>
#include <WebSocketsServer.h>

const char* ssid = "SmartBoard";
const char* password = "12345678";

String validToken = "abc123";

int relayPins[] = {2, 4};
int buttonPins[] = {5, 18};  
const int totalSwitches = sizeof(relayPins) / sizeof(relayPins[0]);

WebSocketsServer ws(81);
StaticJsonDocument<512> switches;

unsigned long lastDebounceTime[2] = {0, 0};
const unsigned long debounceDelay = 50;
int lastButtonState[2];
int currentButtonState[2];

void initSwitches() {
  switches["switches"] = JsonArray();
  for (int i = 0; i < totalSwitches; i++) {
    JsonObject sw = switches["switches"].add<JsonObject>();
    sw["id"] = i + 1;
    sw["state"] = "OFF";
  }
}

void broadcastSwitchState() {
  for (int i = 0; i < totalSwitches; i++) {
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

void toggleSwitchByButton(int index) {
  JsonArray arr = switches["switches"].as<JsonArray>();

  if (index >= arr.size()) return;

  String currentState = arr[index]["state"];
  String newState = (currentState == "ON") ? "OFF" : "ON";
  arr[index]["state"] = newState;

  broadcastSwitchState();
}

void handleButtons() {
  for (int i = 0; i < totalSwitches; i++) {
    int reading = digitalRead(buttonPins[i]);
    
    if (reading != lastButtonState[i]) {
      lastDebounceTime[i] = millis(); 
    }
    if ((millis() - lastDebounceTime[i]) > debounceDelay) {
      if (reading != currentButtonState[i]) {
        currentButtonState[i] = reading;
        if (currentButtonState[i] == LOW) {
          toggleSwitchByButton(i);
        }
      }
    }
    lastButtonState[i] = reading;
  }
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

  if (t == "toggle") {
    int id = data["id"];
    String st = data["state"];
    for (JsonObject sw : switches["switches"].as<JsonArray>()) {
      if (sw["id"] == id) sw["state"] = st;
    }
    broadcastSwitchState();
  }

  if (t == "all") {
    String v = data["state"];
    for (JsonObject sw : switches["switches"].as<JsonArray>()) {
      sw["state"] = v;
    }
    broadcastSwitchState();
  }

  if (t == "switches") {
    switches["switches"] = data["switches"];
    broadcastSwitchState();
  }
}

void setup() {
  Serial.begin(115200);
  
  for (int i = 0; i < totalSwitches; i++) {
    pinMode(relayPins[i], OUTPUT);
    digitalWrite(relayPins[i], HIGH);  
  }

  for (int i = 0; i < totalSwitches; i++) {
    pinMode(buttonPins[i], INPUT_PULLUP); 
    lastButtonState[i] = HIGH;
    currentButtonState[i] = HIGH;
  }

  initSwitches();

  WiFi.softAP(ssid, password);
  Serial.print("Access Point IP: ");
  Serial.println(WiFi.softAPIP());

  ws.begin();
  ws.onEvent(webSocketEvent);
}

void loop() {
  ws.loop();
  handleButtons(); 
}
