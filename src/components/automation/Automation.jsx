import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Save,
  Zap,
  Power,
  Clock,
  Smartphone,
  Unlock,
  MoveUp,
  MoveDown,
  CheckCircle2,
  XCircle,
  Ban,
  Zap as ZapIcon,
} from "lucide-react";
import { useAppContext } from "../../context/AppContext";

const TRIGGER_TYPES = [
  {
    id: "shake",
    label: "Shake Device",
    icon: Smartphone,
    desc: "Trigger when you shake the phone",
  },
  {
    id: "unlock",
    label: "Unlock Phone",
    icon: Unlock,
    desc: "Trigger when lock screen is dismissed",
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
  {
    id: "time",
    label: "Scheduled Time",
    icon: Clock,
    desc: "Trigger at a specific time daily",
  },
];

const SWITCH_STATES = [
  {
    value: "IGNORE",
    label: "IGNORE",
    color: "text-neutral-500",
    border: "border-neutral-700",
    bg: "bg-neutral-900",
  },
  {
    value: "ON",
    label: "TURN ON",
    color: "text-green-500",
    border: "border-green-500/50",
    bg: "bg-green-500/10",
  },
  {
    value: "OFF",
    label: "TURN OFF",
    color: "text-red-500",
    border: "border-red-500/50",
    bg: "bg-red-500/10",
  },
];

export default function AutomationEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { config, automations, updateAutomation } = useAppContext();

  const [selectedType, setSelectedType] = useState("shake");
  const [timeValue, setTimeValue] = useState("08:00");
  const [actions, setActions] = useState([]);

  const existing = useMemo(
    () => automations?.find((a) => a.id === id),
    [automations, id]
  );

  useEffect(() => {
    if (existing) {
      const trg = existing.trigger || "shake";

      const isTime = trg.includes(":");

      setSelectedType(isTime ? "time" : trg);
      if (isTime) setTimeValue(trg);

      setActions(existing.actions || []);
    }
  }, [existing]);

  const handleActionChange = (switchId, newState) => {
    setActions((prev) => {
      const filtered = prev.filter((a) => a.id !== switchId);
      if (newState === "IGNORE") return filtered;
      return [...filtered, { id: switchId, state: newState }];
    });
  };

  const getActionState = (switchId) => {
    return actions.find((a) => a.id === switchId)?.state || "IGNORE";
  };

  const handleSave = () => {
    const finalTrigger = selectedType === "time" ? timeValue : selectedType;

    const typeObj = TRIGGER_TYPES.find((t) => t.id === selectedType);
    const title =
      selectedType === "time"
        ? `Daily at ${timeValue}`
        : typeObj?.label || "Automation";

    const payload = {
      trigger: finalTrigger,
      title: title,
      enabled: true,
      actions: actions,
      switchCount: actions.length,
    };

    updateAutomation(id || finalTrigger, payload);
    navigate(-1);
  };

  if (!config) return <div className="text-white p-10">Loading...</div>;

  const currentTriggerDef = TRIGGER_TYPES.find((t) => t.id === selectedType);

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8 font-sans pb-24">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* HEADER */}
        <header className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-3 bg-neutral-900 rounded-full border border-neutral-800 hover:bg-neutral-800 transition-all"
          >
            <ArrowLeft size={20} className="text-neutral-400" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">
              {existing ? "Edit Automation" : "New Automation"}
            </h1>
            <p className="text-neutral-500 text-sm">
              Configure triggers and device actions
            </p>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* LEFT COL: TRIGGER SELECTION */}
          <div className="space-y-6">
            <section className="bg-neutral-900/50 backdrop-blur border border-neutral-800 rounded-3xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-yellow-500/10 rounded-lg">
                  <Zap className="w-5 h-5 text-yellow-500" />
                </div>
                <h2 className="font-semibold text-lg">When this happens...</h2>
              </div>

              <div className="space-y-4">
                <label className="text-sm text-neutral-400 font-medium ml-1">
                  Trigger Event
                </label>

                <div className="relative group">
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="w-full appearance-none bg-neutral-950 text-white pl-5 pr-10 py-4 rounded-xl border border-neutral-800 focus:border-blue-500 outline-none cursor-pointer text-lg font-medium"
                  >
                    {TRIGGER_TYPES.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-500">
                    {currentTriggerDef && <currentTriggerDef.icon size={20} />}
                  </div>
                </div>

                {/* Description Text */}
                <p className="text-sm text-neutral-500 px-1">
                  {currentTriggerDef?.desc}
                </p>

                {/* Conditional Time Picker */}
                {selectedType === "time" && (
                  <div className="animate-in fade-in slide-in-from-top-2 pt-2">
                    <label className="text-sm text-neutral-400 font-medium ml-1 block mb-2">
                      Set Time
                    </label>
                    <input
                      type="time"
                      value={timeValue}
                      onChange={(e) => setTimeValue(e.target.value)}
                      className="w-full bg-neutral-950 text-white px-5 py-4 rounded-xl border border-neutral-800 focus:border-blue-500 outline-none text-xl font-mono tracking-widest"
                    />
                  </div>
                )}
              </div>
            </section>
          </div>

          <div className="space-y-6">
            <section className="bg-neutral-900/50 backdrop-blur border border-neutral-800 rounded-3xl p-6 flex flex-col h-full max-h-[400px]">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-cyan-500/10 rounded-lg">
                    <Power className="w-5 h-5 text-cyan-500" />
                  </div>
                  <h2 className="font-semibold text-lg">Do this...</h2>
                </div>
                <span className="text-xs bg-neutral-800 text-neutral-400 px-2 py-1 rounded-md border border-neutral-700">
                  {actions.length} Selected
                </span>
              </div>

              <div className="flex-1 overflow-y-auto pr-1 space-y-3 custom-scrollbar">
                {config.switches.map((sw) => {
                  const currentState = getActionState(sw.id);
                  const style = SWITCH_STATES.find(
                    (s) => s.value === currentState
                  );

                  return (
                    <div
                      key={sw.id}
                      className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${style.bg} ${style.border}`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm bg-neutral-950 border border-neutral-800 ${style.color}`}
                        >
                          {sw.id}
                        </div>
                        <span
                          className={`font-medium ${
                            currentState !== "IGNORE"
                              ? "text-white"
                              : "text-neutral-400"
                          }`}
                        >
                          {sw.label}
                        </span>
                      </div>

                      <div className="relative">
                        <select
                          value={currentState}
                          onChange={(e) =>
                            handleActionChange(sw.id, e.target.value)
                          }
                          className={`appearance-none pl-3 pr-9 py-2 rounded-lg bg-neutral-950 border text-xs font-bold tracking-wider outline-none focus:ring-2 focus:ring-opacity-50 cursor-pointer ${
                            style.color === "text-neutral-500"
                              ? "text-neutral-400 border-neutral-700"
                              : `${style.color} ${style.border}`
                          }`}
                        >
                          {SWITCH_STATES.map((s) => (
                            <option key={s.value} value={s.value}>
                              {s.label}
                            </option>
                          ))}
                        </select>
                        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                          {currentState === "ON" && (
                            <CheckCircle2
                              size={14}
                              className="text-green-500"
                            />
                          )}
                          {currentState === "OFF" && (
                            <XCircle size={14} className="text-red-500" />
                          )}
                          {currentState === "IGNORE" && (
                            <Ban size={14} className="text-neutral-600" />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        </div>

        {/* SAVE BUTTON */}
        <button
          onClick={handleSave}
          className="w-full py-4 bg-blue-600 hover:bg-blue-500 rounded-2xl font-bold text-lg text-white shadow-lg shadow-blue-900/20 flex items-center justify-center gap-3 transition-transform active:scale-[0.99]"
        >
          <Save size={20} />
          Save Configuration
        </button>
      </div>
    </div>
  );
}
