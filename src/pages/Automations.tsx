import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import AutomationCard from "../components/AutomationCard";
import { useAppStore } from "../store/useAppStore";

export default function Automations() {
  const navigate = useNavigate();
  const { automations, toggleAutomation } = useAppStore();

  return (
    <div className="min-h-screen pb-24 px-6 pt-8 bg-linear-to-br from-zinc-50 via-zinc-100 to-zinc-50 dark:from-zinc-950 dark:via-black dark:to-zinc-950 transition-colors duration-300">
      <header className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-linear-to-r from-zinc-900 to-zinc-600 dark:from-zinc-100 dark:to-zinc-400 bg-clip-text text-transparent">
            Automations
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">
            Manage your smart routines
          </p>
        </div>
        <button 
            onClick={() => {
                navigate('/automations/new');
            }}
            className="bg-linear-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white p-3 rounded-2xl transition-all shadow-lg shadow-blue-500/25 active:scale-95"
        >
            <Plus size={22} strokeWidth={2.5} />
        </button>
      </header>

      <div className="grid grid-cols-1 gap-6">
        {automations && automations.length > 0 ? (
          automations.map((automation) => (
            <AutomationCard
              key={automation.id}
              title={automation.title}
              switchCount={automation.switchCount}
              lastTriggered={automation.lastTriggered}
              enabled={automation.enabled}
              onToggle={() => toggleAutomation(automation.id)}
              onConfigure={() => navigate(`/automations/${automation.id}`)}
            />
          ))
        ) : (
          <div className="text-center py-16 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-2xl border border-zinc-200 dark:border-zinc-800 border-dashed shadow-lg dark:shadow-zinc-950/50">
            <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-zinc-100 to-zinc-200 dark:from-zinc-900 dark:to-zinc-800 flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Plus size={28} className="text-zinc-500 dark:text-zinc-400" />
            </div>
            <p className="text-zinc-600 dark:text-zinc-400 font-medium mb-1">No automations yet</p>
            <p className="text-sm text-zinc-500 dark:text-zinc-500 mb-6">Create your first automation to get started</p>
            <button 
                onClick={() => navigate('/automations/new')}
                className="px-6 py-3 rounded-xl text-sm font-semibold bg-linear-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white shadow-lg shadow-blue-500/25 transition-all active:scale-95"
            >
                Create Automation
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
