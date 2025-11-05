// src/context/AppContext.jsx
import { createContext, useContext, useState, useEffect } from "react";

const AppContext = createContext(null);

export function useAppContext() {
    return useContext(AppContext);
}

export function AppProvider({ children }) {
    const [settings, setSettings] = useState(() => {

        const storedSettings = JSON.parse(localStorage.getItem("appSettings"));
        return storedSettings || {
            address: "ws://localhost:8080",
            token: "abc123",
            wifi: { ssid: "", password: "" },
            switches: ["Fan", "Light Bulb"],
        };
    });

    useEffect(() => {
        localStorage.setItem("appSettings", JSON.stringify(settings));
    }, [settings]);

    const saveSettings = (updatedSettings) => {
        setSettings(updatedSettings);
    };

    return (
        <AppContext.Provider value={{ settings, saveSettings }}>
            {children}
        </AppContext.Provider>
    );
}
