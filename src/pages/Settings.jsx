import { useState, useEffect } from "react";
import {
  Server,
  Lightbulb,
  Save,
  Radio,
  Loader2
} from "lucide-react";
import { useAppContext } from "../context/AppContext";

export default function Settings() {
  const { config, saveConfig, connectWebSocket } = useAppContext();

  const [draft, setDraft] = useState({
    address: "",
    token: "",
    switches: []
  });

  const [isSavingLabels, setIsSavingLabels] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    if (config) {
      setDraft({
        address: config.address || "",
        token: config.token || "",
        switches: config.switches || []
      });
    }
  }, [config]);

  const updateDraft = (key, value) => {
    setDraft(prev => ({ ...prev, [key]: value }));
  };

  const updateSwitchLabel = (index, value) => {
    const list = [...draft.switches];
    list[index] = { ...list[index], label: value };
    updateDraft("switches", list);
  };

  const handleSaveLabels = async () => {
    setIsSavingLabels(true);
    await saveConfig({ ...config, switches: draft.switches });
    setIsSavingLabels(false);
  };

  const handleSaveAndConnect = async () => {
    setIsConnecting(true);
    const newConfig = { 
      ...config, 
      address: draft.address, 
      token: draft.token 
    };
    
    await saveConfig(newConfig);
    await connectWebSocket();
    setIsConnecting(false);
  };

  if (!config) return null;

  return (
    <div className="min-h-screen text-white relative max-w-4xl mx-auto p-6 space-y-6 pb-20">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-2">
          Settings
        </h1>
        <p className="text-sm text-gray-400">Configure your Smart Board</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Switch Labels Section */}
        <div className="bg-neutral-900/40 rounded-3xl border border-neutral-700/50 p-6 flex flex-col">
          <div className="flex items-center gap-3 mb-6">
            <Lightbulb className="w-5 h-5 text-cyan-400" />
            <h2 className="text-xl font-bold">Switch Labels</h2>
          </div>

          <div className="space-y-4 flex-1">
            {draft.switches.map((sw, i) => (
              <div key={sw.id || i} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/30 shrink-0">
                  <span className="font-bold text-blue-300">{sw.id}</span>
                </div>
                <input
                  type="text"
                  value={sw.label}
                  onChange={(e) => updateSwitchLabel(i, e.target.value)}
                  className="flex-1 bg-neutral-800 text-white px-4 py-2 rounded-xl border border-neutral-700 focus:border-cyan-500 outline-none transition-colors"
                  placeholder={`Switch ${sw.id}`}
                />
              </div>
            ))}
          </div>

          <button
            onClick={handleSaveLabels}
            disabled={isSavingLabels}
            className="mt-6 w-full py-3 bg-neutral-800 hover:bg-neutral-700 border border-neutral-600 rounded-xl flex items-center justify-center gap-2 transition-all font-medium disabled:opacity-50"
          >
            {isSavingLabels ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Labels
          </button>
        </div>

        {/* Developer Settings */}
        <div className="bg-neutral-900/40 rounded-3xl border border-neutral-700/50 p-6 flex flex-col">
          <div className="flex items-center gap-3 mb-6">
            <Server className="w-5 h-5 text-purple-400" />
            <h2 className="text-xl font-bold">Connection</h2>
          </div>

          <div className="space-y-5 flex-1">
            <div>
              <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
                WebSocket URL
              </label>
              <input
                type="text"
                value={draft.address}
                onChange={(e) => updateDraft("address", e.target.value)}
                placeholder="ws://192.168.1.4:81"
                className="w-full font-mono bg-neutral-800 px-4 py-3 rounded-xl border border-neutral-700 focus:border-purple-500 outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
                Auth Token
              </label>
              <input
                type="text"
                value={draft.token}
                onChange={(e) => updateDraft("token", e.target.value)}
                placeholder="Secret Token"
                className="w-full font-mono bg-neutral-800 px-4 py-3 rounded-xl border border-neutral-700 focus:border-purple-500 outline-none transition-colors"
              />
            </div>
          </div>

          <button
            onClick={handleSaveAndConnect}
            disabled={isConnecting}
            className="mt-6 w-full py-3 bg-blue-600 hover:opacity-90 rounded-xl flex items-center justify-center gap-2 transition-all font-bold shadow-lg shadow-purple-900/20 disabled:opacity-50"
          >
            {isConnecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Radio className="w-4 h-4" />}
            Save & Connect
          </button>
        </div>
      </div>
    </div>
  );
}