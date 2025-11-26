import { ChevronRight } from "lucide-react";

export default function AutomationCard({
  title,
  switchCount,
  lastTriggered,
  enabled,
  onToggle,
  onConfigure,
}) {
  return (
    <div className="border border-white/15 rounded-2xl overflow-hidden bg-white/5 w-full">
      <div className="flex items-center justify-between p-5 border-b border-white/10">
        <h2 className="text-xl font-semibold text-white">{title}</h2>
        <button
          onClick={onToggle}
          className={`w-11 h-6 rounded-full relative transition-colors cursor-pointer ${
            enabled ? "bg-blue-500" : "bg-white/20"
          }`}
        >
          <span
            className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${
              enabled ? "right-1" : "left-1"
            }`}
          ></span>
        </button>
      </div>

      <div className="p-5 space-y-3.5">
        <div className="flex justify-between items-center">
          <span className="text-gray-400 text-sm">Bound Switches</span>
          <span className="text-white font-semibold">{switchCount}</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-gray-400 text-sm">Last Triggered</span>
          <span className="text-white font-medium">
            {lastTriggered || <span className="text-gray-500">Never</span>}
          </span>
        </div>
      </div>

      <button
        onClick={onConfigure}
        className="w-full flex items-center justify-between px-5 py-3.5 border-t border-white/10 text-white hover:bg-white/5 transition-colors cursor-pointer"
      >
        <span className="font-medium">Configure</span>
        <ChevronRight size={18} />
      </button>
    </div>
  );
}
