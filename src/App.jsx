import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import BottomNav from "./components/BottomNav";
import Home from "./pages/Home.jsx";
import Settings from "./pages/Settings.jsx";

export default function App() {
    return (
        <BrowserRouter>
            <div className="bg-neutral-950 min-h-screen pb-16">
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/settings" element={<Settings />} />
                </Routes>

                <BottomNav /> {/* Always visible */}
            </div>
        </BrowserRouter>
    );
}
