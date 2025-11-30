import { registerPlugin } from "@capacitor/core";
import type { PluginListenerHandle } from "@capacitor/core";
import { AppConfig } from "../../types";

export interface SmartBoardPlugin {
  addListener(
    eventName: string,
    listenerFunc: (data: any) => void
  ): Promise<PluginListenerHandle>;
  removeAllListeners(): Promise<void>;
  setConfig(options: AppConfig): Promise<void>;
  getConfig(): Promise<AppConfig>;
  startWebSocket(): Promise<void>;
  stopWebSocket(): Promise<void>;
  sendAction(data: any): Promise<void>;
  startAutomationService({ rules }: { rules: any[] }): Promise<void>;
  getAutomations(): Promise<{ rules: any[] }>;
  setAutomations(options: { rules: any[] }): Promise<void>;
  getOwwModels(): Promise<{ models: string[] }>;
  requestBatteryOpt(): Promise<void>;
}

export const SmartBoard = registerPlugin<SmartBoardPlugin>("SmartBoard", {
  web: () => import("./web").then((m) => new m.SmartBoardWeb()),
});
