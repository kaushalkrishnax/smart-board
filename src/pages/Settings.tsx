import { useState, useEffect, useRef, useCallback } from "react";
import {
  Server,
  Radio,
  Loader2,
  Palette,
  Code,
  Lightbulb,
  Mic,
} from "lucide-react";
import { useAppStore } from "../store/useAppStore";
import { AppConfig } from "../types";

export default function Settings() {
  const {
    config,
    saveConfig,
    picovoiceModels,
    connectSocket,
    theme,
    setTheme,
  } = useAppStore();

  const [draft, setDraft] = useState<AppConfig>({
    url: "",
    token: "",
    switches: [],
    picovoiceAccessKey: "",
    picovoiceModel: "Jarvis",
  });

  const [isConnecting, setIsConnecting] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const autoSave = useCallback(
    (updated: AppConfig) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(async () => {
        await saveConfig(updated);
      }, 800);
    },
    [saveConfig]
  );

  const updateDraft = (key: keyof AppConfig, value: any) => {
    setDraft((prev) => {
      const updated = { ...prev, [key]: value };
      autoSave(updated);
      return updated;
    });
  };

  const updateSwitchLabel = (index: number, value: string) => {
    setDraft((prev) => {
      const list = [...prev.switches];
      list[index] = { ...list[index], label: value };
      const updated = { ...prev, switches: list };
      autoSave(updated);
      return updated;
    });
  };

  useEffect(() => {
    if (config) {
      setDraft({
        url: config.url || "",
        token: config.token || "",
        switches: config.switches || [],
        picovoiceAccessKey: config.picovoiceAccessKey || "",
        picovoiceModel: config.picovoiceModel || "Jarvis",
      });
    }
  }, [config]);

  const handleSaveAndConnect = async () => {
    setIsConnecting(true);
    await saveConfig(draft);
    await connectSocket();
    setIsConnecting(false);
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-zinc-50 to-zinc-100 dark:from-zinc-950 dark:to-black text-zinc-900 dark:text-zinc-50 pb-24 px-6 pt-8 transition-colors duration-300">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight bg-linear-to-r from-zinc-900 to-zinc-600 dark:from-zinc-100 dark:to-zinc-400 bg-clip-text text-transparent">
          Settings
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">
          Configure your Smart Board
        </p>
      </header>

      <div className="space-y-4">
        <section className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-lg dark:shadow-zinc-950/50 overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-3">
            <div className="p-2 bg-linear-to-br from-purple-500 to-pink-500 rounded-xl">
              <Palette size={18} className="text-white" />
            </div>
            <h2 className="text-base font-semibold tracking-tight">
              Appearance
            </h2>
          </div>

          <div className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  Dark Theme
                </p>
              </div>
              <button
                type="button"
                onClick={() => setTheme(theme === "light" ? "dark" : "light")}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900 ${
                  theme === "dark"
                    ? "bg-linear-to-r from-indigo-600 to-purple-600"
                    : "bg-zinc-300"
                }`}
              >
                <span
                  className={`flex h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform duration-300 items-center justify-center ${
                    theme === "dark" ? "translate-x-7" : "translate-x-1"
                  }`}
                >
                  {theme === "dark" ? (
                    <span className="text-purple-600">🌙</span>
                  ) : (
                    <span className="text-yellow-500">☀️</span>
                  )}
                </span>
              </button>
            </div>
          </div>
        </section>

        <section className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-lg dark:shadow-zinc-950/50 overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-3">
            <div className="p-2 bg-linear-to-br from-zinc-600 to-zinc-500 rounded-xl">
              <Lightbulb size={18} className="text-white" />
            </div>
            <h2 className="text-base font-semibold tracking-tight">
              Switch Labels
            </h2>
          </div>

          <div className="p-5 space-y-3">
            {draft.switches.map((sw, idx) => (
              <div key={sw.id} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-linear-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-900 flex items-center justify-center text-zinc-600 dark:text-zinc-300 text-sm font-bold shadow-sm">
                  {sw.id}
                </div>
                <input
                  type="text"
                  value={sw.label}
                  onChange={(e) => updateSwitchLabel(idx, e.target.value)}
                  className="flex-1 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-600/50 focus:border-zinc-600 transition-all"
                  placeholder={`Switch ${sw.id}`}
                />
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-lg dark:shadow-zinc-950/50 overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-3">
            <div className="p-2 bg-linear-to-br from-indigo-500 to-violet-500 rounded-xl">
              <Mic size={18} className="text-white" />
            </div>
            <h2 className="text-base font-semibold tracking-tight">
              Voice Assistant
            </h2>
          </div>

          <div className="p-5 space-y-4">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-medium text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
                Picovoice Access Key
              </label>
              <input
                type="text"
                value={draft.picovoiceAccessKey || ""}
                onChange={(e) =>
                  updateDraft("picovoiceAccessKey", e.target.value)
                }
                placeholder="Paste your Picovoice Access Key here"
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
              />
              <p className="text-[10px] text-zinc-500 dark:text-zinc-500 px-1">
                Required for voice control. Get it free at{" "}
                <a
                  href="https://console.picovoice.ai/"
                  target="_blank"
                  rel="noreferrer"
                  className="underline hover:text-indigo-500"
                >
                  console.picovoice.ai
                </a>
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
                Picovoice Model
              </label>
              <div className="relative">
                <select
                  value={draft.picovoiceModel || "Jarvis"}
                  onChange={(e) =>
                    updateDraft("picovoiceModel", e.target.value)
                  }
                  className="w-full appearance-none bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all cursor:pointer"
                >
                  {picovoiceModels.map((model) => (
                    <option key={model} value={model}>
                      {model}
                    </option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400">
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-lg dark:shadow-zinc-950/50 overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-3">
            <div className="p-2 bg-linear-to-br from-blue-500 to-cyan-500 rounded-xl">
              <Code size={18} className="text-white" />
            </div>
            <h2 className="text-base font-semibold tracking-tight">
              Developer Settings
            </h2>
          </div>

          <div className="p-5 space-y-4">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-medium text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
                <Server size={14} />
                Server url
              </label>
              <input
                type="text"
                value={draft.url}
                onChange={(e) => updateDraft("url", e.target.value)}
                placeholder="ws://192.168.1.100:81"
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
                Auth Token
              </label>
              <input
                type="password"
                value={draft.token}
                onChange={(e) => updateDraft("token", e.target.value)}
                placeholder="Optional security token"
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
              />
            </div>

            <button
              onClick={handleSaveAndConnect}
              disabled={isConnecting}
              className="w-full bg-linear-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
            >
              {isConnecting ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Radio size={18} />
              )}
              {isConnecting ? "Connecting..." : "Save & Connect"}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
