export interface Switch {
  id: number;
  label: string;
  state?: "ON" | "OFF";
}

export interface AutomationAction {
  id: number;
  state: "ON" | "OFF";
}

export interface Automation {
  id: string;
  title: string;
  trigger: string;
  switchCount: number;
  enabled: boolean;
  actions: AutomationAction[];
  lastTriggered?: string;
}

export interface AppConfig {
  url: string;
  token: string;
  switches: Switch[];
  owwModel: string;
}

export interface WebSocketMessage {
  type: "switches" | "connected" | "closed" | "error";
  switches?: Switch[];
}
