// src/context/SocketContext.jsx
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useAppContext } from "./AppContext";

const SocketContext = createContext(null);

export function useSocketContext() {
  return useContext(SocketContext);
}

export function SocketProvider({ children }) {
  const socketRef = useRef(null);
  const { settings } = useAppContext();
  const [socket, setSocket] = useState(null);
  const [socketReady, setSocketReady] = useState(false);
  const [switches, setSwitches] = useState([]);
  const [ONCount, setONCount] = useState(0);

  // 1. Handle WebSocket connection, listen for messages, and toggle state updates
  useEffect(() => {
    if (!settings?.address) {
      console.warn("No WebSocket address stored. Go to Settings and save it.");
      return;
    }

    const ws = new WebSocket(settings.address);

    socketRef.current = ws;
    setSocket(ws);

    ws.onopen = () => {
      console.log("WebSocket connected");

      // Send auth immediately on connection
      ws.send(
        JSON.stringify({
          type: "auth",
          token: settings.token,
        })
      );

      setSocketReady(true);
    };

    ws.onerror = (err) => console.error("WebSocket Error:", err);

    ws.onclose = () => {
      console.warn("WebSocket disconnected");
      setSocketReady(false);
    };

    // Listen for updates from server
    ws.onmessage = (event) => {
      let data;
      try {
        data = JSON.parse(event.data);
      } catch {
        console.error("Invalid JSON from server:", event.data);
        return;
      }

      console.log("Received data:", data);

      if (data.type === "switches" && Array.isArray(data.switches)) {
        setSwitches(
          data.switches.map((sw, idx) => ({
            id: sw.id,
            state: sw.state
          }))
        );
        setONCount(data.switches.filter((sw) => sw.state === "ON").length);
      }
    };

    return () => ws.close();
  }, []);

  const handleToggle = (id, currentState) => {
    const newState = currentState === "ON" ? "OFF" : "ON";

    socket?.send(
      JSON.stringify({
        type: "toggle",
        id,
        state: newState,
      })
    );
  };

  const sendAll = (targetState) => {
    socket?.send(
      JSON.stringify({
        type: "all",
        state: targetState,
      })
    );
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        socketReady,
        switches,
        ONCount,
        handleToggle,
        sendAll,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}
