import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { SmartBoard } from "../plugins/smart-board";

const AppContext = createContext(null);
export const useAppContext = () => useContext(AppContext);

const DEFAULT_CONFIG = {
  address: "",
  token: "",
  switches: [
    { id: 1, label: "Fan" },
    { id: 2, label: "Light Bulb" },
  ],
};

const DEFAULT_AUTOMATIONS = [
  {
    id: "shake",
    title: "Shake Phone",
    trigger: "shake",
    switchCount: 1,
    enabled: true,
    actions: [
      { id: 1, state: "ON" },
      { id: 2, state: "OFF" },
    ],
  },
];

export function AppProvider({ children }) {
  const [config, setConfig] = useState(null);
  const [automations, setAutomations] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const syncAutomations = async (currentAutomations) => {
    const payload = currentAutomations.map((auto) => ({
      id: auto.id,
      title: auto.title,
      trigger: auto.trigger || auto.id,
      enabled: auto.enabled,
      switchCount: auto.actions?.length || 0,
      actions: auto.actions || [],
    }));

    try {
      await SmartBoard.setAutomations({
        rules: payload,
      });
    } catch (err) {
      console.error("Failed to sync automations to native:", err);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const storedConfig = await SmartBoard.getConfig();
        let safeSwitches = storedConfig.switches;

        if (
          Array.isArray(safeSwitches) &&
          typeof safeSwitches[0] === "string"
        ) {
          safeSwitches = safeSwitches.map((lbl, i) => ({
            id: i + 1,
            label: lbl,
          }));
        }

        setConfig({
          address: storedConfig.url || "",
          token: storedConfig.token || "",
          switches: safeSwitches?.length
            ? safeSwitches
            : DEFAULT_CONFIG.switches,
        });

        const storedAuto = await SmartBoard.getAutomations();

        if (storedAuto && storedAuto.rules && storedAuto.rules.length > 0) {
          setAutomations(storedAuto.rules);
        } else {
          setAutomations(DEFAULT_AUTOMATIONS);
          await syncAutomations(DEFAULT_AUTOMATIONS);
        }
      } catch (e) {
        console.error("Initialization error:", e);
        setConfig(DEFAULT_CONFIG);
        setAutomations(DEFAULT_AUTOMATIONS);
      } finally {
        setIsLoaded(true);
      }
    };

    loadData();
  }, []);

  const saveConfig = useCallback(
    async (newConfig) => {
      try {
        setConfig(newConfig);
        await SmartBoard.setConfig({
          url: newConfig.address,
          token: newConfig.token,
          switches: newConfig.switches,
        });

        if (
          newConfig.address !== config?.address ||
          newConfig.token !== config?.token
        ) {
          await SmartBoard.stopWebSocket();
          await SmartBoard.startWebSocket();
        }
      } catch (err) {
        console.error(err);
      }
    },
    [config]
  );

  const connectWebSocket = useCallback(async () => {
    try {
      await SmartBoard.startWebSocket();
    } catch (err) {
      console.error(err);
    }
  }, []);

  const toggleAutomation = useCallback((id) => {
    setAutomations((prev) => {
      const updated = prev.map((a) =>
        a.id === id ? { ...a, enabled: !a.enabled } : a
      );
      syncAutomations(updated);
      return updated;
    });
  }, []);

  const updateAutomation = useCallback((id, updates) => {
    setAutomations((prev) => {
      const exists = prev.find((a) => a.id === id);
      let updated;

      if (exists) {
        updated = prev.map((a) => (a.id === id ? { ...a, ...updates } : a));
      } else {
        const newAuto = {
          id: id,
          enabled: true,
          actions: [],
          ...updates,
        };
        updated = [...prev, newAuto];
      }

      syncAutomations(updated);
      return updated;
    });
  }, []);

  if (!isLoaded || !config) return null;

  return (
    <AppContext.Provider
      value={{
        config,
        saveConfig,
        connectWebSocket,
        automations,
        toggleAutomation,
        updateAutomation,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
