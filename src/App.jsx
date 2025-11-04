import { useState } from "react";
import Home from "./pages/Home.jsx";
import Settings from "./pages/Settings.jsx";
import BottomNav from "./components/BottomNav";

export default function App() {
    const [activeTab, setActiveTab] = useState("home");

    return (
        <div className="bg-neutral-950 min-h-screen">
            {activeTab === "home" && <Home />}
            {activeTab === "settings" && <Settings />}
            <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
        </div>
    );
}
