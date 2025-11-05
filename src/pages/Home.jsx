// src/pages/Home.jsx
import { useEffect, useState } from "react";
import { useSocketContext } from "../context/SocketContext";
import { useAppContext } from "../context/AppContext";
import { Power, Lightbulb, Zap, Fan, Moon, Sun } from "lucide-react";

const mockTotalEnergy = 124.5;

export default function Home() {
  const { settings } = useAppContext();
  const { switches, ONCount, handleToggle, sendAll } = useSocketContext();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (switches.length > 0) {
      setLoading(false);
    }
  }, [switches]);

  const getIcon = (index) => {
    const icons = [Fan, Lightbulb, Zap, Power];
    return icons[index % icons.length];
  };

  const LightSwitchSkeleton = () => (
    <div className="h-52 bg-neutral-800/50 rounded-2xl border border-neutral-700/50 p-4 animate-pulse flex flex-col">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-9 h-9 bg-neutral-700 rounded-lg"></div>
        <div className="h-4 w-20 bg-neutral-700 rounded"></div>
      </div>
      <div className="flex-1 flex items-center justify-center">
        <div className="w-20 h-20 bg-neutral-700/50 rounded-full"></div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-950 via-neutral-950 to-black text-white relative overflow-hidden flex flex-col p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-4xl sm:text-5xl font-bold mb-2 bg-linear-to-r from-blue-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">
          Smart Board
        </h1>
        <p className="text-sm text-gray-400">Control Your Appliances Remotely</p>
      </div>

      {/* Rich Stats Banner */}
      <div className="relative bg-linear-to-br from-blue-600/20 via-cyan-600/10 to-purple-600/10 backdrop-blur-xl rounded-2xl border border-blue-500/30 p-5 overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-t from-blue-500/10 to-transparent opacity-70"></div>
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-500/20 rounded-lg animate-pulse">
                <Zap className="w-4 h-4 text-blue-400" />
              </div>
              <p className="text-xs font-semibold text-blue-300">System Active</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-2xl font-bold text-white">
                <span>{ONCount}</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">ON</p>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-white">{switches.length}</div>
              <p className="text-xs text-gray-400 mt-1">Total</p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-2xl font-bold text-white">
                <span>{mockTotalEnergy}</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">kWh</p>
            </div>
          </div>
        </div>
      </div>

      {/* All ON / OFF Buttons */}
      <div className="flex gap-3 py-4 w-full">
        <div onClick={() => sendAll("ON")} className="w-1/2">
          <div className="bg-linear-to-br from-blue-500 to-blue-600 backdrop-blur-sm p-4 rounded-2xl border border-blue-400/50 shadow-lg shadow-blue-500/30 cursor-pointer">
            <div className="flex flex-col items-center gap-2">
              <Sun className="w-6 h-6 text-white" />
              <span className="text-xs font-bold text-white">All On</span>
            </div>
          </div>
        </div>

        <div onClick={() => sendAll("OFF")} className="w-1/2">
          <div className="bg-neutral-800 backdrop-blur-sm p-4 rounded-2xl border border-neutral-700 hover:border-neutral-600 cursor-pointer transition-all">
            <div className="flex flex-col items-center gap-2">
              <Moon className="w-6 h-6 text-gray-400" />
              <span className="text-xs font-bold text-gray-300">All Off</span>
            </div>
          </div>
        </div>
      </div>

      {/* Switches Grid */}
      <div className="grid grid-cols-2 gap-4 py-6">
        {loading ? (
          <>
            <LightSwitchSkeleton />
            <LightSwitchSkeleton />
          </>
        ) : (
          switches.map((sw, index) => {
            const IconComponent = getIcon(index);
            return (
              <div
                key={sw.id}
                onClick={() => handleToggle(sw.id, sw.state)}
                className={`relative h-52 rounded-2xl overflow-hidden transition-all duration-500 cursor-pointer
                    ${sw.state
                    ? "bg-neutral-800"
                    : "bg-neutral-800/50 border border-neutral-700/50"
                  }
                `}
              >
                <div className="h-full flex flex-col justify-between p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className={`p-2 rounded-lg transition-all duration-300
                            ${sw.state === "ON" ? "bg-green-500/20" : "bg-neutral-700/30"}`}
                      >
                        <IconComponent
                          className={`w-5 h-5 transition-colors duration-300
                              ${sw.state === "ON" ? "text-green-400" : "text-gray-400"}`}
                        />
                      </div>
                      <h3 className={`text-sm font-semibold transition-colors duration-300
                          ${sw.state === "ON" ? "text-white" : "text-gray-300"}`}>
                        {settings?.switches?.[index] ?? `Switch ${idx + 1}`}
                      </h3>
                    </div>
                  </div>

                  <div className="flex-1 flex items-center justify-center">
                    <div
                      className={`relative w-20 h-20 rounded-full transition-all duration-300
                          ${sw.state
                          ? "bg-neutral-900 shadow-inner-dark"
                          : "bg-neutral-900/50 shadow-outer-dark"
                        }
                      `}
                    >
                      <div className={`absolute inset-0 rounded-full ${sw.state === "ON" ? "bg-green-500/50 blur-lg" : "bg-red-500/50 blur-lg"}`}></div>

                      <div
                        className={`absolute inset-1.5 rounded-full flex items-center justify-center transition-all duration-300
                            ${sw.state === "ON" ? "bg-neutral-800" : "bg-neutral-800/80"}`}
                      >
                        <span
                          className={`text-sm font-bold tracking-wider transition-all duration-300
                              ${sw.state === "ON" ? "text-green-300" : "text-red-500"}`}
                        >
                          {sw.state === "ON" ? "ON" : "OFF"}
                        </span>
                      </div>

                      {!sw.state && (
                        <div className="absolute inset-0 rounded-full border-2 border-black/50"></div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
