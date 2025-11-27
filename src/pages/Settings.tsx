import { useState, useEffect, useRef, useCallback } from "react";
import { Server, Radio, Loader2, Palette, Code, Lightbulb } from "lucide-react";
import { useAppStore } from "../store/useAppStore";
import { AppConfig } from "../types";

export default function Settings() {
  const { config, saveConfig, connectSocket, theme, setTheme } = useAppStore();

  const [draft, setDraft] = useState<AppConfig>({
    address: "",
    token: "",
    switches: [],
  });

  const [isConnecting, setIsConnecting] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (config) {
      setDraft({
        address: config.address || "",
        token: config.token || "",
        switches: config.switches || [],
      });
    }
  }, [config]);

  const autoSaveLabels = useCallback(
    (switches: typeof draft.switches) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(async () => {
        if (config) {
          await saveConfig({ ...config, switches });
        }
      }, 800);
    },
    [config, saveConfig]
  );

  const updateDraft = (key: keyof AppConfig, value: any) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const updateSwitchLabel = (index: number, value: string) => {
    const list = [...draft.switches];
    list[index] = { ...list[index], label: value };
    updateDraft("switches", list);
    autoSaveLabels(list);
  };

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
                Server Address
              </label>
              <input
                type="text"
                value={draft.address}
                onChange={(e) => updateDraft("address", e.target.value)}
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
