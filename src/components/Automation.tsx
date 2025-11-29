import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Smartphone,
  Unlock,
  MoveUp,
  MoveDown,
  Clock,
  Trash2,
  Sun,
  Moon,
} from "lucide-react";
import { useAppStore } from "../store/useAppStore";
import { AutomationAction } from "../types";

const TRIGGER_TYPES = [
  {
    id: "shake",
    label: "Shake Device",
    icon: Smartphone,
    desc: "Trigger when you shake the phone",
  },
  {
    id: "time",
    label: "Scheduled Time",
    icon: Clock,
    desc: "Trigger at a specific time daily",
  },
  {
    id: "unlock",
    label: "Unlock Phone",
    icon: Unlock,
    desc: "Trigger when lock screen is dismissed",
  },
  {
    id: "proximity_far",
    label: "Proximity Far",
    icon: Sun,
    desc: "Phone is away from an object (e.g., on table)",
  },
  {
    id: "proximity_near",
    label: "Proximity Near",
    icon: Moon,
    desc: "Phone is close to an object (e.g., in pocket)",
  },
  {
    id: "face_up",
    label: "Face Up",
    icon: MoveUp,
    desc: "Place phone flat on table, screen up",
  },
  {
    id: "face_down",
    label: "Face Down",
    icon: MoveDown,
    desc: "Place phone flat on table, screen down",
  },
];

export default function Automation() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    config,
    automations,
    updateAutomation,
    addAutomation,
    deleteAutomation,
  } = useAppStore();

  const isNew = id === "new";

  const existing = useMemo(
    () => automations?.find((a) => a.id === id),
    [automations, id]
  );

  const [title, setTitle] = useState(existing?.title || "New Automation");
  const [selectedType, setSelectedType] = useState("shake");
  const [timeValue, setTimeValue] = useState("08:00");
  const [actions, setActions] = useState<AutomationAction[]>([]);

  useEffect(() => {
    if (existing) {
      setTitle(existing.title);
      const trg = existing.trigger || "shake";
      const isTime = trg.includes(":");

      setSelectedType(isTime ? "time" : trg);
      if (isTime) setTimeValue(trg);

      setActions(existing.actions || []);
    } else if (isNew) {
      if (config?.switches) {
        setActions(
          config.switches.map((s) => ({ id: s.id, state: "IGNORE" as any }))
        );
      }
    }
  }, [existing, isNew, config]);

  const handleSave = async () => {
    const trigger = selectedType === "time" ? timeValue : selectedType;

    const finalActions = actions.filter((a) => a.state !== ("IGNORE" as any));

    const automationData = {
      id: isNew ? Date.now().toString() : id!,
      title,
      trigger,
      switchCount: finalActions.length,
      enabled: true,
      actions: finalActions,
    };

    if (isNew) {
      await addAutomation(automationData);
    } else {
      await updateAutomation(automationData);
    }
    navigate(-1);
  };

  const handleDelete = async () => {
    if (!isNew && id) {
      await deleteAutomation(id);
      navigate(-1);
    }
  };

  const cycleState = (switchId: number) => {
    setActions((prev) => {
      const exists = prev.find((a) => a.id === switchId);
      const currentState = exists?.state || "IGNORE";

      let newState: "IGNORE" | "OFF" | "ON" = "OFF";
      if (currentState === "IGNORE") newState = "OFF";
      else if (currentState === "OFF") newState = "ON";
      else if (currentState === "ON") newState = "IGNORE";

      if (exists) {
        return prev.map((a) =>
          a.id === switchId ? { ...a, state: newState as any } : a
        );
      }
      return [...prev, { id: switchId, state: newState as any }];
    });
  };

  const getActionState = (switchId: number) => {
    return actions.find((a) => a.id === switchId)?.state || "IGNORE";
  };

  const getStateDisplay = (state: string) => {
    if (state === "ON")
      return {
        text: "ON",
        color: "bg-green-500 dark:bg-green-600",
        textColor: "text-white",
      };
    if (state === "OFF")
      return {
        text: "OFF",
        color: "bg-red-500 dark:bg-red-600",
        textColor: "text-white",
      };
    return {
      text: "—",
      color: "bg-zinc-200 dark:bg-zinc-800",
      textColor: "text-zinc-500 dark:text-zinc-400",
    };
  };

  const selectedTriggerDesc = TRIGGER_TYPES.find(
    (t) => t.id === selectedType
  )?.desc;

  return (
    <div className="min-h-screen bg-linear-to-br from-zinc-50 to-zinc-100 dark:from-zinc-950 dark:to-black text-zinc-900 dark:text-zinc-50 pb-20 transition-colors duration-300 flex flex-col">
      <div className="fixed top-0 left-0 right-0 z-40 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl border-b border-zinc-200 dark:border-zinc-800 px-4 py-3 flex items-center justify-between max-w-3xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
        >
          <ArrowLeft size={22} />
        </button>
        <h1 className="font-semibold text-base">
          {isNew ? "Create Automation" : "Edit Automation"}
        </h1>
        <div className="w-10" />
      </div>

      <div className="pt-20 px-6 space-y-5 flex-1 overflow-y-auto pb-6">
        <div className="flex flex-col gap-4">
          <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
            Automation Name
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3.5 text-base font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-sm"
            placeholder="e.g. Morning Routine"
          />
        </div>

        <div className="flex flex-col gap-4">
          <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
            Trigger Event
          </label>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3.5 text-base font-medium text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-sm"
          >
            {TRIGGER_TYPES.map((type) => (
              <option key={type.id} value={type.id}>
                {type.label}
              </option>
            ))}
          </select>
          {selectedTriggerDesc && (
            <p className="text-xs text-zinc-500 dark:text-zinc-400 px-1">
              {selectedTriggerDesc}
            </p>
          )}
        </div>

        {selectedType === "time" && (
          <div className="flex flex-col gap-4">
            <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
              Trigger Time
            </label>
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 flex justify-center shadow-sm">
              <input
                type="time"
                value={timeValue}
                onChange={(e) => setTimeValue(e.target.value)}
                className="bg-transparent text-3xl font-bold focus:outline-none text-center w-full text-zinc-900 dark:text-zinc-100"
              />
            </div>
          </div>
        )}

        <div className="flex flex-col gap-4">
          <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
            Switch Actions
          </label>
          <div className="flex flex-col gap-4.5">
            {config?.switches.map((sw) => {
              const currentState = getActionState(sw.id);
              const stateDisplay = getStateDisplay(currentState);
              return (
                <div
                  key={sw.id}
                  onClick={() => cycleState(sw.id)}
                  className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-4 shadow-sm hover:shadow-md transition-all cursor-pointer active:scale-[0.98] flex items-center justify-between"
                >
                  <span className="font-medium text-base text-zinc-900 dark:text-zinc-100">
                    {sw.label}
                  </span>
                  <div
                    className={`${stateDisplay.color} ${stateDisplay.textColor} px-4 py-2 rounded-lg font-bold text-xs min-w-[60px] text-center shadow-sm`}
                  >
                    {stateDisplay.text}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 max-w-3xl mx-auto z-40 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl border-t border-zinc-200 dark:border-zinc-800 px-6 py-4 flex items-center gap-3">
        {!isNew && (
          <button
            onClick={handleDelete}
            className="px-5 py-3 rounded-xl text-sm font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/50 transition-all active:scale-95 flex items-center gap-2"
          >
            <Trash2 size={16} />
            Delete
          </button>
        )}
        <button
          onClick={handleSave}
          className="flex-1 px-6 py-3.5 rounded-xl text-sm font-bold bg-linear-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white shadow-lg shadow-blue-500/25 transition-all active:scale-[0.98]"
        >
          Save Automation
        </button>
      </div>
    </div>
  );
}
