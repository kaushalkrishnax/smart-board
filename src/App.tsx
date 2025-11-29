import { useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
  matchPath,
} from "react-router-dom";
import BottomNav from "./components/BottomNav";
import Home from "./pages/Home";
import Automations from "./pages/Automations";
import Settings from "./pages/Settings";
import AutomationEditor from "./components/Automation";
import { Capacitor } from "@capacitor/core";
import { App as CapacitorApp } from "@capacitor/app";
import { useAppStore } from "./store/useAppStore";

export default function App() {
  const { loadData, connectSocket, startAutomationService, theme } = useAppStore();

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    loadData().then(() => {
      connectSocket();
      startAutomationService("");
    });
  }, [loadData, connectSocket, startAutomationService]);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-linear-to-br from-zinc-50 via-zinc-100 to-zinc-50 dark:from-zinc-950 dark:via-black dark:to-zinc-950 text-zinc-900 dark:text-zinc-50 transition-colors duration-300">
        <AppRoutes />
      </div>
    </BrowserRouter>
  );
}

if (Capacitor.isNativePlatform()) {
  CapacitorApp.addListener("backButton", ({ canGoBack }) => {
    if (!canGoBack) {
      CapacitorApp.exitApp();
    } else {
      window.history.back();
    }
  });
}

function AppRoutes() {
  const location = useLocation();

  const hideBottomNav = Boolean(
    matchPath({ path: "/automations/:id", end: true }, location.pathname)
  );

  return (
    <div className="max-w-3xl mx-auto">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/automations" element={<Automations />} />
        <Route path="/automations/:id" element={<AutomationEditor />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
      {!hideBottomNav && <BottomNav />}
    </div>
  );
}
