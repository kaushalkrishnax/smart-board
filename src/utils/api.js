// utils/api.js

// Fake backend data
let switches = [
  { id: 1, label: "Fan", state: false },
  { id: 2, label: "White Bulb", state: true },
  { id: 3, label: "LED Strip", state: false },
  { id: 4, label: "Heater", state: true },
];

export async function getSwitchStates() {
  return new Promise(resolve => {
    setTimeout(() => resolve(switches), 300);
  });
}

export async function toggleSwitch(id, newState) {
  return new Promise(resolve => {
    switches = switches.map(sw =>
      sw.id === id ? { ...sw, state: newState } : sw
    );
    setTimeout(() => resolve({ success: true }), 200);
  });
}

// Example WiFi / Address settings
export async function getSettings() {
  return {
    address: "http://localhost:8080",
    wifi: { ssid: "ESPWIFI", password: "********" },
      switches: ["Fan", "White Bulb", "LED Strip", "Heater"],
  };
}

export async function updateSetting(section, key, value) {
  console.log(`Updated ${section}.${key} = ${value}`);
  return { success: true };
}