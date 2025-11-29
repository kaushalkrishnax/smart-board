import { NavLink } from "react-router-dom";
import { HomeIcon, AutomationsIcon, SettingsIcon } from "../icons";

export default function BottomNav() {
  const navItems = [
    { name: "Home", icon: HomeIcon, path: "/" },
    {
      name: "Automations",
      icon: AutomationsIcon,
      path: "/automations",
      center: true,
    },
    { name: "Settings", icon: SettingsIcon, path: "/settings" },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl border-t border-zinc-200 dark:border-zinc-800 flex justify-around items-center py-2 pb-safe transition-colors duration-300 shadow-xl dark:shadow-zinc-950/50">
      {navItems.map(({ name, icon: Icon, path, center }) => (
        <NavLink
          key={name}
          to={path}
          end
          className="relative flex flex-col items-center transition-all duration-200"
        >
          {({ isActive }) => (
            <div
              className={`flex items-center justify-center transition-all duration-300 w-14 h-14 rounded-full ${
                center && isActive
                  ? "shadow-xl bg-linear-to-r from-blue-600 to-cyan-600 border border-blue-400 dark:border-cyan-500 -translate-y-8 scale-120 text-white"
                  : "w-14 h-14 scale-100 text-zinc-400 dark:text-zinc-500"
              } ${
                !center && isActive ? "text-blue-600 dark:text-blue-400" : ""
              }`}
            >
              <Icon focused={isActive} />
            </div>
          )}
        </NavLink>
      ))}
    </div>
  );
}
