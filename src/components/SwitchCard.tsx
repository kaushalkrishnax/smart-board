import { Power, Lightbulb, Zap, Fan } from "lucide-react";

interface SwitchCardProps {
  id: number;
  label: string;
  state: "ON" | "OFF";
  onToggle: (id: number, currentState: string) => void;
  index: number;
}

export default function SwitchCard({
  id,
  label,
  state,
  onToggle,
  index,
}: SwitchCardProps) {
  const isOn = state === "ON";

  const getIcon = (idx: number) => {
    const icons = [Fan, Lightbulb, Zap, Power];
    return icons[idx % icons.length];
  };

  const Icon = getIcon(index);

  return (
    <div
      onClick={() => onToggle(id, state)}
      className={`relative h-52 rounded-2xl overflow-hidden transition-all duration-500 cursor-pointer border
        ${
          isOn
            ? "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-lg dark:shadow-none"
            : "bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800"
        }
      `}
    >
      <div className="h-full flex flex-col justify-between p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className={`p-2 rounded-lg transition-all duration-300
                ${
                  isOn
                    ? "bg-emerald-100 dark:bg-emerald-500/20"
                    : "bg-zinc-200 dark:bg-zinc-800"
                }`}
            >
              <Icon
                className={`w-5 h-5 transition-colors duration-300
                  ${
                    isOn
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-zinc-400 dark:text-zinc-500"
                  }`}
              />
            </div>
            <h3
              className={`text-sm font-semibold transition-colors duration-300
                ${
                  isOn
                    ? "text-zinc-900 dark:text-zinc-100"
                    : "text-zinc-500 dark:text-zinc-400"
                }`}
            >
              {label}
            </h3>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center">
          <div
            className={`relative w-20 h-20 rounded-full transition-all duration-300
              ${
                isOn
                  ? "bg-zinc-100 dark:bg-zinc-950 shadow-inner"
                  : "bg-red-50 dark:bg-red-900/20 shadow-inner"
              }
            `}
          >
            <div
              className={`absolute inset-0 rounded-full transition-opacity duration-500 ${
                isOn
                  ? "bg-emerald-500 blur-xl opacity-40 dark:opacity-60"
                  : "bg-red-500 blur-xl opacity-20 dark:opacity-40"
              }`}
            ></div>

            <div
              className={`absolute inset-1.5 rounded-full flex items-center justify-center transition-all duration-300 border
                ${
                  isOn
                    ? "bg-white dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800"
                    : "bg-white/80 dark:bg-zinc-900/80 border-zinc-200 dark:border-zinc-800"
                }`}
            >
              <span
                className={`text-sm font-bold tracking-wider transition-all duration-300
                  ${
                    isOn
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-red-500 dark:text-red-500"
                  }`}
              >
                {isOn ? "ON" : "OFF"}
              </span>
            </div>

            {!isOn && (
              <div className="absolute inset-0 rounded-full border-2 border-zinc-900/5 dark:border-black/50"></div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}