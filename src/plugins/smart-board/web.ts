import { WebPlugin } from "@capacitor/core";
import type { SmartBoardPlugin } from "./index";

import { AppConfig } from "../../types";

export class SmartBoardWeb extends WebPlugin implements SmartBoardPlugin {
  private ws: WebSocket | null = null;

  private readonly STORAGE_KEY = "appSettings";
  private readonly AUTOMATION_RULES = "automation_rules";

  async setConfig(options: AppConfig): Promise<void> {
    const current = await this.getConfig();

    const updated = {
      ...current,
      ...options,
    };

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updated));
  }

  async getConfig(): Promise<AppConfig> {
    const raw = localStorage.getItem(this.STORAGE_KEY);
    const defaults = {
      url: "",
      token: "",
      switches: [],
      picovoiceAccessKey: "",
      picovoiceModel: "Jarvis",
    };

    if (!raw) return defaults;

    const parsed = JSON.parse(raw);
    return { ...defaults, ...parsed };
  }

  async startWebSocket(): Promise<void> {
    await this.stopWebSocket();
    const config = await this.getConfig();
    if (!config.url) return;

    try {
      this.ws = new WebSocket(config.url);
      this.ws.onopen = () => {
        if (config.token)
          this.ws?.send(JSON.stringify({ type: "auth", token: config.token }));
      };
      this.ws.onmessage = (ev) => {
        this.notifyListeners("esp_event", { data: ev.data });
      };
    } catch (e) {
      console.error(e);
    }
  }

  async stopWebSocket(): Promise<void> {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  async sendAction(payload: any): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(
        typeof payload === "string" ? payload : JSON.stringify(payload)
      );
    }
  }

  async startAutomationService(rules: string): Promise<void> {
    console.log("Web: Starting automation service with rules:", rules);
  }

  async getAutomations(): Promise<{ rules: any[] }> {
    const raw = localStorage.getItem(this.AUTOMATION_RULES);
    return { rules: raw ? JSON.parse(raw) : [] };
  }

  async setAutomations(options: { rules: any[] }): Promise<void> {
    localStorage.setItem(this.AUTOMATION_RULES, JSON.stringify(options.rules));
  }

  async getPicovoiceModels(): Promise<{ models: string[] }> {
    return {
      models: ["Alexa", "Jarvis", "Computer", "Picovoice", "Terminator"],
    };
  }

  async requestBatteryOpt(): Promise<void> {
    console.log("Web: Battery optimization requested (No-op)");
  }
}
