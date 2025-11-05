import React from "react";
import { NavLink } from "react-router-dom";
import { Home, Settings } from "lucide-react";

export default function BottomNav() {
  const navItems = [
    { name: "Home", icon: Home, path: "/" },
    { name: "Settings", icon: Settings, path: "/settings" },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-neutral-900 border-t border-neutral-800 flex justify-around py-3 z-50">
      {navItems.map(({ name, icon: Icon, path }) => (
        <NavLink
          key={name}
          to={path}
          end
          className={({ isActive }) =>
            `flex flex-col items-center transition-all ${
              isActive ? "text-blue-500 scale-110" : "text-gray-400 opacity-70"
            }`
          }
        >
          <Icon size={22} />
          <span className="text-xs mt-1">{name}</span>
        </NavLink>
      ))}
    </div>
  );
}
