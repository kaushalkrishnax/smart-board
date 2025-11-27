import { ChevronRight, Zap, Clock, Activity } from "lucide-react";

interface AutomationCardProps {
  title: string;
  switchCount: number;
  lastTriggered?: string;
  enabled: boolean;
  onToggle: () => void;
  onConfigure: () => void;
}

export default function AutomationCard({
  title,
  switchCount,
  lastTriggered,
  enabled,
  onToggle,
  onConfigure,
}: AutomationCardProps) {
  return (
    <div className="group relative w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-sm transition-all duration-300 hover:shadow-md hover:border-zinc-300 dark:hover:border-zinc-700 overflow-hidden">
      <div
        className={`absolute top-0 left-0 right-0 h-1 transition-all duration-500 ${
          enabled
            ? "bg-blue-500 opacity-100"
            : "bg-zinc-300 dark:bg-zinc-700 opacity-0"
        }`}
      />

      <div className="px-4 py-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div
              className={`flex items-center justify-center w-10 h-10 rounded-2xl transition-all duration-300 ${
                enabled
                  ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500"
              }`}
            >
              <Zap size={20} className={enabled ? "fill-current" : ""} />
            </div>
            <div className="flex flex-col">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
                {title}
              </h3>
            </div>
          </div>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
            className={`relative w-14 h-8 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
              enabled ? "bg-blue-600" : "bg-zinc-200 dark:bg-zinc-700"
            }`}
          >
            <span
              className={`absolute top-1 left-1 bg-white w-6 h-6 rounded-full shadow-md transition-transform duration-300 flex items-center justify-center ${
                enabled ? "translate-x-6" : "translate-x-0"
              }`}
            ></span>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="flex flex-col p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center gap-2 text-zinc-400 mb-1">
              <Activity size={14} />
              <span className="text-xs font-medium uppercase tracking-wider">
                Devices
              </span>
            </div>
            <span className="text-zinc-900 dark:text-zinc-200 font-semibold text-sm">
              {switchCount} Bound
            </span>
          </div>

          <div className="flex flex-col p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center gap-2 text-zinc-400 mb-1">
              <Clock size={14} />
              <span className="text-xs font-medium uppercase tracking-wider">
                Last Run
              </span>
            </div>
            <span className="text-zinc-900 dark:text-zinc-200 font-semibold text-sm truncate">
              {lastTriggered || "--"}
            </span>
          </div>
        </div>
      </div>

      <div
        onClick={onConfigure}
        className="border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 p-4 flex items-center justify-between cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors group/footer"
      >
        <span className="text-sm font-semibold text-zinc-600 dark:text-zinc-400 group-hover/footer:text-zinc-900 dark:group-hover/footer:text-zinc-200 transition-colors">
          Configure Trigger
        </span>
        <div className="w-8 h-8 rounded-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center group-hover/footer:scale-110 transition-transform">
          <ChevronRight
            size={16}
            className="text-zinc-400 dark:text-zinc-500"
          />
        </div>
      </div>
    </div>
  );
}
