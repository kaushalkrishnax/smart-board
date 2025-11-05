// ✅ src/context/SocketContext.jsx
import { createContext, useContext, useEffect, useRef, useState } from "react";

const SocketContext = createContext(null);

export function useSocket() {
  return useContext(SocketContext);
}

export function SocketProvider({ children }) {
  const socketRef = useRef(null);
  const [socketReady, setSocketReady] = useState(false);

  useEffect(() => {
    let settings = null;

    try {
      const raw = localStorage.getItem("appSettings");
      settings = raw ? JSON.parse(raw) : null;
    } catch (err) {
      console.error("❌ Invalid settings JSON in localStorage");
    }

    if (!settings || !settings.address) {
      console.warn("⚠ No WebSocket address stored. Go to Settings first.");
      return;
    }

    console.log("🔌 Connecting WebSocket to:", settings.address);

    // ✅ Use NATIVE WebSocket, not socket.io
    socketRef.current = new WebSocket(settings.address);

    socketRef.current.onopen = () => {
      console.log("✅ WS Connected");

      socketRef.current.send(
        JSON.stringify({
          type: "auth",
          token: settings.token,
        })
      );

      setSocketReady(true);
    };

    socketRef.current.onerror = (err) => {
      console.error("❌ WebSocket Error:", err);
    };

    socketRef.current.onclose = () => {
      console.warn("⚠ WS Disconnected");
      setSocketReady(false);
    };

    return () => socketRef.current?.close();
  }, []);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, socketReady }}>
      {children}
    </SocketContext.Provider>
  );
}
