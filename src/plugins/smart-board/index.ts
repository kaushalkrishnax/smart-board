// index.ts
import { registerPlugin } from "@capacitor/core";
import type { PluginListenerHandle } from "@capacitor/core";

export interface SmartBoardPlugin {
  addListener(eventName: string, listenerFunc: (data: any) => void): Promise<PluginListenerHandle>;
  removeAllListeners(): Promise<void>;
  setConfig(options: {
    url: string;
    token: string;
    switches: { id: number; label: string }[];
  }): Promise<void>;
  getConfig(): Promise<{
    url: string | null;
    token: string | null;
    switches: { id: number; label: string }[];
  }>;
  startWebSocket(): Promise<void>;
  stopWebSocket(): Promise<void>;
  sendAction(data: any): Promise<void>;
  getAutomations(): Promise<{ rules: any[] }>;
  setAutomations(options: { rules: any[] }): Promise<void>;
  requestBatteryOpt(): Promise<void>;
}

export const SmartBoard = registerPlugin<SmartBoardPlugin>("SmartBoard", {
  web: () => import("./web").then((m) => new m.SmartBoardWeb()),
});
