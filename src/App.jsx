import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
  matchPath,
} from "react-router-dom";
import BottomNav from "./components/BottomNav";
import Home from "./pages/Home.jsx";
import Automations from "./pages/Automations.jsx";
import Settings from "./pages/Settings.jsx";
import Automation from "./components/automation/Automation.jsx";
import { Capacitor } from "@capacitor/core";
import { App as CapacitorApp } from "@capacitor/app";

export default function App() {
  return (
    <BrowserRouter>
      <div className="bg-neutral-950 min-h-screen">
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
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/automations" element={<Automations />} />
        <Route path="/automations/:id" element={<Automation />} />
        <Route path="/scheduling" element={<Scheduling />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
      {!hideBottomNav && <BottomNav />}
    </>
  );
}
