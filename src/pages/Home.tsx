import { useEffect, useState } from "react";
import { Sun, Moon, Zap, Activity, WifiOff } from "lucide-react";
import { useAppStore } from "../store/useAppStore";
import SwitchCard from "../components/SwitchCard";

const SkeletonSwitch = () => (
  <div className="h-52 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 flex flex-col justify-between animate-pulse">
    <div className="flex items-center gap-2">
      <div className="w-9 h-9 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
      <div className="h-4 w-24 bg-zinc-200 dark:bg-zinc-800 rounded" />
    </div>
    <div className="flex-1 flex items-center justify-center">
      <div className="w-20 h-20 rounded-full bg-zinc-200 dark:bg-zinc-800" />
    </div>
  </div>
);

export default function Home() {
  const {
    switches,
    isConnected,
    hasTriedConnect,
    config,
    connectSocket,
    toggleSwitch,
    setAllSwitches,
  } = useAppStore();

  const [isLoading, setIsLoading] = useState(!isConnected);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const activeCount = switches.filter((s) => s.state === "ON").length;
  const totalCount = switches.length;

  const hasConfig = Boolean(config && config.address);
  const showOfflineState = !isLoading && !isConnected;

  return (
    <div className="min-h-screen pb-24 px-6 pt-8 bg-linear-to-br from-zinc-50 via-zinc-100 to-zinc-50 dark:from-zinc-950 dark:via-black dark:to-zinc-950 transition-colors duration-300 flex flex-col">
      <header className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-linear-to-r from-zinc-900 to-zinc-600 dark:from-zinc-100 dark:to-zinc-400 bg-clip-text text-transparent">
            My Home
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">
            Control your smart devices
          </p>
        </div>

        <div
          className={`px-3 py-1.5 rounded-full text-xs font-semibold border flex items-center gap-2 shadow-sm ${
            isLoading || isConnected
              ? "bg-linear-to-r from-emerald-50 to-green-50 text-emerald-700 dark:from-emerald-950/50 dark:to-green-950/50 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
              : "bg-linear-to-r from-red-50 to-rose-50 text-red-700 dark:from-red-950/50 dark:to-rose-950/50 dark:text-red-400 border-red-200 dark:border-red-800"
          }`}
        >
          <div
            className={`w-1.5 h-1.5 rounded-full ${
              isLoading || isConnected
                ? "bg-emerald-500 dark:bg-emerald-400 animate-pulse"
                : "bg-red-500 dark:bg-red-400"
            }`}
          />
          {isLoading ? "Syncing..." : isConnected ? "Online" : "Offline"}
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="relative overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm h-28 flex items-center justify-between group hover:border-blue-500/30 transition-all">
          <div className="flex flex-col justify-center h-full gap-4 z-10">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">
              Active
            </span>
            <span className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 leading-none">
              {isLoading ? (
                <div className="h-6 w-6 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
              ) : (
                activeCount
              )}
            </span>
          </div>

          <div className="h-12 w-12 rounded-xl bg-blue-50 dark:bg-blue-900/10 flex items-center justify-center text-blue-500 dark:text-blue-400 group-hover:scale-110 transition-transform duration-300">
            <Zap
              size={24}
              className={isLoading ? "opacity-50" : "fill-current"}
            />
          </div>

          <div className="absolute bottom-0 left-0 w-full h-1 bg-zinc-50 dark:bg-zinc-800/50">
            <div
              className="h-full bg-blue-500/80 dark:bg-blue-500 rounded-r-full transition-all duration-1000 ease-out"
              style={{
                width: isLoading
                  ? "0%"
                  : `${(activeCount / totalCount) * 100}%`,
              }}
            />
          </div>
        </div>

        <div className="relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm h-28 flex items-center justify-between group hover:border-purple-500/30 transition-all">
          <div className="flex flex-col justify-center h-full gap-4 z-10">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">
              Total
            </span>
            <span className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 leading-none">
              {isLoading ? (
                <div className="h-6 w-6 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
              ) : (
                totalCount
              )}
            </span>
          </div>

          <div className="h-12 w-12 rounded-xl bg-purple-50 dark:bg-purple-900/10 flex items-center justify-center text-purple-500 dark:text-purple-400 group-hover:scale-110 transition-transform duration-300">
            <Activity size={24} />
          </div>
        </div>
      </div>

      <div className="flex gap-3 mb-5">
        <button
          onClick={() => setAllSwitches("ON")}
          disabled={isLoading || !isConnected}
          className="flex-1 bg-linear-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white rounded-2xl px-4 py-6 flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-emerald-500/25 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Sun size={18} />
          <span className="text-sm">All On</span>
        </button>
        <button
          onClick={() => setAllSwitches("OFF")}
          disabled={isLoading || !isConnected}
          className="flex-1 bg-linear-to-r from-zinc-600 to-zinc-700 hover:from-zinc-700 hover:to-zinc-800 text-white rounded-2xl p-4 flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-zinc-600/25 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Moon size={18} />
          <span className="text-sm">All Off</span>
        </button>
      </div>

      <div className="flex-1 flex flex-col py-4">
        <h2 className="text-lg font-bold mb-4 text-zinc-800 dark:text-zinc-200 flex items-center justify-between">
          <span>Your Devices</span>
          {!showOfflineState && !isLoading && (
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              {switches.length} devices
            </span>
          )}
        </h2>

        {isLoading ? (
          <div className="grid grid-cols-2 gap-4 pb-4">
            <SkeletonSwitch />
            <SkeletonSwitch />
          </div>
        ) : showOfflineState ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
            <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-zinc-100 to-zinc-200 dark:from-zinc-900 dark:to-zinc-800 flex items-center justify-center mb-4 shadow-lg">
              <WifiOff size={28} className="text-zinc-500 dark:text-zinc-400" />
            </div>
            <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
              {!hasConfig ? "Setup Required" : "Connection Lost"}
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6 max-w-xs">
              {!hasConfig
                ? "Configure your server settings to get started."
                : "Unable to connect to your smart devices. Check the connection."}
            </p>
            {hasTriedConnect && (
              <button
                onClick={connectSocket}
                className="px-6 py-3 rounded-xl text-sm font-semibold bg-linear-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white shadow-lg shadow-blue-500/25 transition-all active:scale-95"
              >
                Try to Reconnect
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 pb-4">
            {switches.map((sw, idx) => (
              <SwitchCard
                key={sw.id}
                id={sw.id}
                label={sw.label}
                state={sw.state || "OFF"}
                onToggle={toggleSwitch}
                index={idx}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
