import { useNavigate } from "react-router-dom";
import AutomationCard from "../components/automation/AutomationCard";
import { useAppContext } from "../context/AppContext";

export default function Automations() {
  const navigate = useNavigate();
  const { automations, toggleAutomation } = useAppContext();

  return (
    <div className="min-h-screen text-white relative overflow-hidden flex flex-col p-6 max-w-4xl mx-auto pb-20">
      <div className="text-center mb-6">
        <h1 className="text-4xl sm:text-5xl font-bold mb-2 bg-linear-to-r from-blue-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">
          Automations
        </h1>
        <p className="text-sm text-gray-400">Configure Automated Actions</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
          <p className="text-gray-400 col-span-full text-center">
            No automations configured yet.
          </p>
        )}
      </div>
    </div>
  );
}
