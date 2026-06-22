import { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import api from "../api/axios.js";
import { useAuth } from "./AuthContext.jsx";
import { useToast } from "./ToastContext.jsx";

const NotificationContext = createContext(null);
const RECONNECT_DELAY = 3000;

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount]     = useState(0);
  const wsRef            = useRef(null);
  const reconnectTimer   = useRef(null);

  const fetchInitial = useCallback(async () => {
    try {
      const [listRes, countRes] = await Promise.all([
        api.get("/notify/"),
        api.get("/notify/unread-count/"),
      ]);
      setNotifications(listRes.data.results ?? listRes.data);
      setUnreadCount(countRes.data.count);
    } catch { /* silent — non-critical on dashboard load */ }
  }, []);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    fetchInitial();

    const connect = () => {
      const token = localStorage.getItem("access_token");
      if (!token) return;
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const ws = new WebSocket(`${protocol}//${window.location.host}/ws/notifications/?token=${token}`);
      wsRef.current = ws;

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        setNotifications((prev) => [data, ...prev].slice(0, 50));
        setUnreadCount((c) => c + 1);
        toast(data.title, "info");
      };

      ws.onclose = () => {
        reconnectTimer.current = setTimeout(connect, RECONNECT_DELAY);
      };
    };
    connect();

    return () => {
      clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
  }, [user, fetchInitial, toast]);

  const markRead = async (id) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    setUnreadCount((c) => Math.max(0, c - 1));
    try { await api.post(`/notify/${id}/read/`); } catch { /* optimistic — ok if it fails */ }
  };

  const markAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
    try { await api.post("/notify/read-all/"); } catch { /* optimistic */ }
  };

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markRead, markAllRead }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be inside NotificationProvider");
  return ctx;
}