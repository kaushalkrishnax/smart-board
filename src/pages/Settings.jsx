// src/pages/Settings.jsx
import { useState } from "react";
import { Wifi, Server, Lightbulb, RefreshCw, Router, Lock, Pin } from "lucide-react";
import { useAppContext } from "../context/AppContext";

export default function Settings() {
  const { settings, saveSettings } = useAppContext();
  const [saving, setSaving] = useState(false);

  const handleChange = (section, key, value) => {
    const updated = { ...settings };

    if (key === "") updated[section] = value;
    else updated[section][key] = value;

    saveSettings(updated);
    setSaving(true);
    setTimeout(() => setSaving(false), 700);
  };

  if (!settings) return null;

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-950 via-neutral-950 to-black text-white relative max-w-4xl mx-auto">
      <div className="relative z-10 p-6 space-y-6">
        <div className="text-center mb-6">
          <h1 className="text-4xl sm:text-5xl font-bold mb-2 bg-linear-to-r from-blue-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">
            Settings
          </h1>
          <p className="text-sm text-gray-400">Modify In-App Settings</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* === 1. Switch Labels === */}
          <div className="bg-neutral-900/40 rounded-3xl border border-neutral-700/50 p-5 space-y-4">
            <div className="flex items-center gap-3">
              <Lightbulb className="w-5 h-5 text-cyan-400" />
              <h2 className="text-xl font-bold">Smart Board Labels</h2>
            </div>

            {settings.switches.map((sw, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/30">
                  <span className="font-bold text-blue-300">{i + 1}</span>
                </div>
                <input
                  type="text"
                  value={sw}
                  onChange={(e) => {
                    const list = [...settings.switches];
                    list[i] = e.target.value;
                    handleChange("switches", "", list);
                  }}
                  className="flex-1 bg-neutral-800 text-white px-4 py-2.5 rounded-lg border border-neutral-700"
                />
              </div>
            ))}
          </div>

          {/* === 2. Developer Settings === */}
          <div className="bg-neutral-900/40 rounded-3xl border border-neutral-700/50 p-5 space-y-4">
            <div className="flex items-center gap-3">
              <Server className="w-5 h-5 text-purple-400" />
              <h2 className="text-xl font-bold">Developer Settings</h2>
            </div>

            <label className="flex items-center gap-2 mb-2 text-sm text-gray-300">
              <Pin className="w-4 h-4" /> WebSocket Address
            </label>
            <input
              type="text"
              value={settings.address}
              onChange={(e) => handleChange("address", "", e.target.value)}
              className="w-full font-mono bg-neutral-800 px-4 py-2.5 rounded-lg border border-neutral-700"
            />

            <label className="flex items-center gap-2 mt-4 mb-2 text-sm text-gray-300">
              Token
            </label>
            <input
              type="text"
              value={settings.token}
              onChange={(e) => handleChange("token", "", e.target.value)}
              className="w-full font-mono bg-neutral-800 px-4 py-2.5 rounded-lg border border-neutral-700"
            />
          </div>
        </div>
      </div>

      {saving && (
        <div className="flex items-center gap-2 text-gray-400 justify-center py-4">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <p>Saving...</p>
        </div>
      )}
    </div>
  );
}
