import { createContext, useContext, useEffect, useState, useMemo } from "react";
import { useAppContext } from "./AppContext";
import { SmartBoard } from "../plugins/smart-board";

const SocketContext = createContext(null);

export function useSocketContext() {
  return useContext(SocketContext);
}

export function SocketProvider({ children }) {
  const { config } = useAppContext();

  const [isConnected, setIsConnected] = useState(false);
  const [switches, setSwitches] = useState([]);

  const activeCount = useMemo(
    () => switches.filter((s) => s.state === "ON").length,
    [switches]
  );

  useEffect(() => {
    if (!config?.address) return;

    let listenerHandle;
    let isActive = true;

    const setupConnection = async () => {
      await SmartBoard.stopWebSocket();

      listenerHandle = await SmartBoard.addListener("esp_event", ({ data }) => {
        if (!isActive) return;

        try {
          const msg = JSON.parse(data);

          if (msg.type === "switches") {
            setSwitches(msg.switches);
          } else if (msg.type === "connected") {
            setIsConnected(true);
          } else if (msg.type === "closed" || msg.type === "error") {
            setIsConnected(false);
          }
        } catch (e) {
          console.error("Failed to parse message", e);
        }
      });

      await SmartBoard.startWebSocket();
    };

    setupConnection();

    return () => {
      isActive = false;
      if (listenerHandle) listenerHandle.remove();
      SmartBoard.stopWebSocket();
    };
  }, [config?.address, config?.token]);

  const actions = {
    toggle: (id, currentState) => {
      SmartBoard.sendAction({
        type: "toggle",
        id,
        state: currentState === "ON" ? "OFF" : "ON",
      });
    },
    setAll: (state) => {
      SmartBoard.sendAction({ type: "all", state });
    },
  };

  return (
    <SocketContext.Provider
      value={{
        socketReady: isConnected,
        switches,
        ONCount: activeCount,
        handleToggle: actions.toggle,
        sendAll: actions.setAll,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}
