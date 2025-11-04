import { useState } from "react";
import { Home, Settings } from "lucide-react";

export default function BottomNav({ activeTab, setActiveTab }) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-neutral-900 border-t border-neutral-800 flex justify-around py-3 text-gray-400">
      <button
        onClick={() => setActiveTab("home")}
        className={`flex flex-col items-center ${
          activeTab === "home" ? "text-blue-500" : ""
        }`}
      >
        <Home size={22} />
        <span className="text-xs mt-1">Home</span>
      </button>

      <button
        onClick={() => setActiveTab("settings")}
        className={`flex flex-col items-center ${
          activeTab === "settings" ? "text-blue-500" : ""
        }`}
      >
        <Settings size={22} />
        <span className="text-xs mt-1">Settings</span>
      </button>
    </div>
  );
}