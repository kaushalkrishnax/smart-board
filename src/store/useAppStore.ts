import { create } from "zustand";
import { SmartBoard } from "../plugins/smart-board";
import { AppConfig, Automation, Switch } from "../types";

interface AppState {
  config: AppConfig | null;
  automations: Automation[];
  switches: Switch[];
  isConnected: boolean;
  isLoaded: boolean;
  hasTriedConnect: boolean;
  theme: "light" | "dark";

  loadData: () => Promise<void>;
  saveConfig: (config: AppConfig) => Promise<void>;
  toggleSwitch: (id: number, currentState: string) => Promise<void>;
  setAllSwitches: (targetState: "ON" | "OFF") => Promise<void>;
  toggleAutomation: (id: string) => Promise<void>;
  updateAutomation: (automation: Automation) => Promise<void>;
  addAutomation: (automation: Automation) => Promise<void>;
  deleteAutomation: (id: string) => Promise<void>;

  connectSocket: () => Promise<void>;
  disconnectSocket: () => Promise<void>;
  setTheme: (mode: "light" | "dark") => void;
}

const DEFAULT_CONFIG: AppConfig = {
  address: "",
  token: "",
  switches: [
    { id: 1, label: "Fan" },
    { id: 2, label: "Light Bulb" },
  ],
};

const DEFAULT_AUTOMATIONS: Automation[] = [
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

const initialTheme =
  (localStorage.getItem("theme") as "light" | "dark") || "light";

if (initialTheme === "dark") {
  document.documentElement.classList.add("dark");
} else {
  document.documentElement.classList.remove("dark");
}

export const useAppStore = create<AppState>((set, get) => ({
  config: null,
  automations: [],
  switches: [],
  isConnected: false,
  isLoaded: false,
  hasTriedConnect: false,
  theme: initialTheme,

  loadData: async () => {
    try {
      const storedConfig = await SmartBoard.getConfig();
      let safeSwitches: any = storedConfig.switches;

      if (
        Array.isArray(safeSwitches) &&
        safeSwitches.length > 0 &&
        typeof safeSwitches[0] === "string"
      ) {
        safeSwitches = safeSwitches.map((lbl: string, i: number) => ({
          id: i + 1,
          label: lbl,
        }));
      }

      const config: AppConfig = {
        address: storedConfig.url || "",
        token: storedConfig.token || "",
        switches:
          safeSwitches && safeSwitches.length
            ? safeSwitches
            : DEFAULT_CONFIG.switches,
      };

      const storedAuto = await SmartBoard.getAutomations();
      let automations = DEFAULT_AUTOMATIONS;

      if (storedAuto && storedAuto.rules && storedAuto.rules.length > 0) {
        automations = storedAuto.rules;
      } else {
        try {
          const payload = DEFAULT_AUTOMATIONS.map((auto) => ({
            id: auto.id,
            title: auto.title,
            trigger: auto.trigger || auto.id,
            enabled: auto.enabled,
            switchCount: auto.actions?.length || 0,
            actions: auto.actions || [],
          }));
          await SmartBoard.setAutomations({ rules: payload });
        } catch (err) {
          console.error("Failed to sync default automations:", err);
        }
      }

      set({ config, automations, isLoaded: true, switches: [] });
    } catch (e) {
      console.error("Initialization error:", e);
      set({
        config: DEFAULT_CONFIG,
        automations: DEFAULT_AUTOMATIONS,
        isLoaded: true,
        switches: [],
      });
    }
  },

  saveConfig: async (newConfig: AppConfig) => {
    const { switches: currentSwitches } = get();
    set({ config: newConfig });
    try {
      await SmartBoard.setConfig({
        url: newConfig.address,
        token: newConfig.token,
        switches: newConfig.switches,
      });

      if (currentSwitches.length > 0) {
        const updatedSwitches = currentSwitches.map((sw) => {
          const configSwitch = newConfig.switches.find((cs) => cs.id === sw.id);
          return configSwitch ? { ...sw, label: configSwitch.label } : sw;
        });
        set({ switches: updatedSwitches });
      }
    } catch (e) {
      console.error("Failed to save config", e);
    }
  },

  connectSocket: async () => {
    const { config } = get();
    if (!config?.address) {
      set({ isConnected: false, hasTriedConnect: true, switches: [] });
      return;
    }

    await SmartBoard.addListener("esp_event", ({ data }: { data: string }) => {
      try {
        const msg = JSON.parse(data);
        if (msg.type === "switches") {
          const { config } = get();
          const switchesWithLabels = msg.switches.map((sw: Switch) => {
            const configSwitch = config?.switches.find((cs) => cs.id === sw.id);
            return {
              ...sw,
              label: configSwitch?.label || `Device ${sw.id}`,
            };
          });
          set({
            switches: switchesWithLabels,
            isConnected: true,
            hasTriedConnect: true,
          });
        } else if (msg.type === "connected") {
          set({ isConnected: true, hasTriedConnect: true });
        } else if (msg.type === "closed" || msg.type === "error") {
          set({ isConnected: false, hasTriedConnect: true, switches: [] });
        }
      } catch (e) {
        console.error("Failed to parse message", e);
      }
    });

    await SmartBoard.startWebSocket();
    set({ hasTriedConnect: true });
  },

  disconnectSocket: async () => {
    await SmartBoard.stopWebSocket();
    set({ isConnected: false, switches: [] });
  },

  toggleSwitch: async (id, currentState) => {
    try {
      await SmartBoard.sendAction({
        type: "toggle",
        id,
        state: currentState === "ON" ? "OFF" : "ON",
      });
    } catch (e) {
      console.error("Failed to toggle switch", e);
    }
  },

  setAllSwitches: async (targetState) => {
    try {
      await SmartBoard.sendAction({ type: "all", state: targetState });
    } catch (e) {
      console.error("Failed to set all switches", e);
    }
  },

  toggleAutomation: async (id) => {
    const { automations } = get();
    const updatedAutomations = automations.map((a) =>
      a.id === id ? { ...a, enabled: !a.enabled } : a
    );

    set({ automations: updatedAutomations });

    const payload = updatedAutomations.map((auto) => ({
      id: auto.id,
      title: auto.title,
      trigger: auto.trigger || auto.id,
      enabled: auto.enabled,
      switchCount: auto.actions?.length || 0,
      actions: auto.actions || [],
    }));

    try {
      await SmartBoard.setAutomations({ rules: payload });
    } catch (err) {
      console.error("Failed to sync automations:", err);
      set({ automations });
    }
  },

  updateAutomation: async (updatedAutomation) => {
    const { automations } = get();
    const newAutomations = automations.map((a) =>
      a.id === updatedAutomation.id ? updatedAutomation : a
    );
    set({ automations: newAutomations });

    const payload = newAutomations.map((auto) => ({
      id: auto.id,
      title: auto.title,
      trigger: auto.trigger || auto.id,
      enabled: auto.enabled,
      switchCount: auto.actions?.length || 0,
      actions: auto.actions || [],
    }));

    try {
      await SmartBoard.setAutomations({ rules: payload });
    } catch (err) {
      console.error("Failed to sync automations:", err);
      set({ automations });
    }
  },

  addAutomation: async (newAutomation) => {
    const { automations } = get();
    const newAutomations = [...automations, newAutomation];
    set({ automations: newAutomations });

    const payload = newAutomations.map((auto) => ({
      id: auto.id,
      title: auto.title,
      trigger: auto.trigger || auto.id,
      enabled: auto.enabled,
      switchCount: auto.actions?.length || 0,
      actions: auto.actions || [],
    }));

    try {
      await SmartBoard.setAutomations({ rules: payload });
    } catch (err) {
      console.error("Failed to sync automations:", err);
      set({ automations });
    }
  },

  deleteAutomation: async (id) => {
    const { automations } = get();
    const newAutomations = automations.filter((a) => a.id !== id);
    set({ automations: newAutomations });

    const payload = newAutomations.map((auto) => ({
      id: auto.id,
      title: auto.title,
      trigger: auto.trigger || auto.id,
      enabled: auto.enabled,
      switchCount: auto.actions?.length || 0,
      actions: auto.actions || [],
    }));

    try {
      await SmartBoard.setAutomations({ rules: payload });
    } catch (err) {
      console.error("Failed to sync automations:", err);
      set({ automations });
    }
  },

  setTheme: (mode) => {
    set({ theme: mode });
    localStorage.setItem("theme", mode);
    if (mode === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  },
}));
