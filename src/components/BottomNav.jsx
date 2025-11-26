import React from "react";
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
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-neutral-900/90 backdrop-blur-md border-t border-neutral-800 flex justify-around items-center py-2">
      {navItems.map(({ name, icon: Icon, path, center }) => (
        <NavLink
          key={name}
          to={path}
          end
          className="relative flex flex-col items-center transition-all duration-200"
        >
          {({ isActive }) => (
            <div
              className={`
                flex items-center justify-center transition-all duration-300 w-14 h-14
                ${
                  center && isActive
                    ? "rounded-full shadow-xl bg-white dark:bg-neutral-800 border border-neutral-700 -translate-y-8 scale-120 outline-8 outline-neutral-950"
                    : "w-14 h-14 scale-100"
                }
              `}
            >
              <Icon focused={isActive} />
            </div>
          )}
        </NavLink>
      ))}
    </div>
  );
}
