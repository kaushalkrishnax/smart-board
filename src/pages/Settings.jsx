import { useEffect, useState } from "react";
import { getSettings, updateSetting } from "../utils/api";

export default function Settings() {
    const [settings, setSettings] = useState(null);

    useEffect(() => {
        getSettings().then(setSettings);
    }, []);

    const handleChange = async (section, key, value) => {
        await updateSetting(section, key, value);

        setSettings(prev => {
            if (key === "") {
                return { ...prev, [section]: value };
            }
            return {
                ...prev,
                [section]: { ...prev[section], [key]: value }
            };
        });
    };

    if (!settings) return <div className="p-6 text-gray-300">Loading...</div>;

    return (
        <div className="min-h-screen bg-neutral-950 text-gray-200 p-6 space-y-6">
            <h1 className="text-2xl font-bold mb-4">Settings</h1>

            <div>
                <h2 className="text-lg font-semibold mb-2 text-blue-400">
                    Developer
                </h2>
                <div className="flex items-center justify-between bg-neutral-800 p-3 rounded-lg border border-neutral-700">
                    <span>Address</span>
                    <input
                        type="text"
                        value={settings.address}
                        onChange={e =>
                            handleChange("address", "", e.target.value)
                        }
                        className="bg-neutral-700 text-white p-2 rounded w-48 text-center"
                    />
                </div>
            </div>

            <div>
                <h2 className="text-lg font-semibold mb-2 text-blue-400">
                    Wi-Fi
                </h2>
                <div className="flex flex-col gap-3">
                    <div className="flex justify-between bg-neutral-800 p-3 rounded-lg border border-neutral-700">
                        <span>SSID</span>
                        <input
                            value={settings.wifi.ssid}
                            onChange={e =>
                                handleChange("wifi", "ssid", e.target.value)
                            }
                            className="bg-neutral-700 text-white p-2 rounded w-32 text-center"
                        />
                    </div>
                    <div className="flex justify-between bg-neutral-800 p-3 rounded-lg border border-neutral-700">
                        <span>Password</span>
                        <input
                            type="password"
                            value={settings.wifi.password}
                            onChange={e =>
                                handleChange("wifi", "password", e.target.value)
                            }
                            className="bg-neutral-700 text-white p-2 rounded w-32 text-center"
                        />
                    </div>
                </div>
            </div>

            <div>
                <h2 className="text-lg font-semibold mb-2 text-blue-400">
                    Smart Board
                </h2>
                <div className="flex flex-col gap-2">
                    {settings.switches.map((sw, i) => (
                        <div
                            key={i}
                            className="bg-neutral-800 p-3 rounded-lg border border-neutral-700 flex justify-between"
                        >
                            <span>Switch {i + 1}</span>
                            <input
                                value={sw}
                                onChange={e => {
                                    const newList = [...settings.switches];
                                    handleChange("switches", "", newList);
                                    newList[i] = e.target.value;
                                    handleChange("switches", "", newList);
                                }}
                                className="bg-neutral-700 text-white p-2 rounded w-40 text-center"
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
