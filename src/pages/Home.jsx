import { useEffect, useState } from "react";
import { getSwitchStates, toggleSwitch } from "../utils/api";

export default function Home() {
  const [switches, setSwitches] = useState([]);

  useEffect(() => {
    getSwitchStates().then(setSwitches);
  }, []);

  const handleToggle = async (id, currentState) => {
    const newState = !currentState;
    await toggleSwitch(id, newState);
    setSwitches(prev =>
      prev.map(sw => (sw.id === id ? { ...sw, state: newState } : sw))
    );
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-950 text-white p-6">
      <h1 className="text-2xl font-bold mb-8 tracking-wide text-gray-100">Smart Board</h1>

      <div className="grid grid-cols-2 gap-6 w-full max-w-md">
        {switches.map((sw) => (
          <div
            key={sw.id}
            className="flex flex-col items-center bg-neutral-800 p-4 rounded-2xl shadow-lg border border-neutral-700 hover:border-blue-500 transition-all duration-200"
          >
            <h2 className="text-lg font-semibold mb-3">{sw.label}</h2>
            <button
              onClick={() => handleToggle(sw.id, sw.state)}
              className={`w-28 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 
                ${sw.state
                  ? "bg-blue-600 shadow-blue-400/50 shadow-md"
                  : "bg-gray-700 text-gray-300"}`}
            >
              {sw.state ? "ON" : "OFF"}
            </button>
            <div
              className={`mt-3 w-3 h-3 rounded-full transition-all duration-300 ${
                sw.state ? "bg-green-400" : "bg-gray-500"
              }`}
            />
          </div>
        ))}
      </div>
    </div>
  );
}