"use client";
import { useEffect, useRef, useCallback, useState } from "react";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/authStore";

const WS_BASE =
  (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1")
    .replace(/^http/, "ws")
    .replace(/\/api\/v1\/?$/, "");

export interface LiveNotification {
  id: string;
  level: "info" | "success" | "warning" | "error";
  event_type: string;
  title: string;
  message: string;
  created_at: string;
}

export function useNotifications() {
  const { isAuthenticated } = useAuthStore();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<LiveNotification[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const markRead = useCallback((id: string) => {
    wsRef.current?.send(JSON.stringify({ action: "mark_read", id }));
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const markAllRead = useCallback(() => {
    notifications.forEach((n) => {
      wsRef.current?.send(JSON.stringify({ action: "mark_read", id: n.id }));
    });
    setNotifications([]);
    setUnreadCount(0);
  }, [notifications]);

  const connect = useCallback(() => {
    if (!isAuthenticated || typeof window === "undefined") return;

    const token = localStorage.getItem("access_token");
    if (!token) return;

    const url = `${WS_BASE}/ws/notifications/?token=${token}`;
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);

        if (msg.type === "unread_count") {
          setUnreadCount(msg.count as number);
          return;
        }

        if (msg.type === "notification") {
          const n = msg.data as LiveNotification;
          setNotifications((prev) => [n, ...prev].slice(0, 20));
          setUnreadCount((c) => c + 1);

          // Show a toast for every live notification
          const toastFn =
            n.level === "success" ? toast.success
            : n.level === "warning" ? toast.warning
            : n.level === "error" ? toast.error
            : toast.info;
          toastFn(n.title, { description: n.message, duration: 6000 });
        }

        if (msg.type === "production_update") {
          // Invalidate relevant React Query caches via a custom event
          window.dispatchEvent(new CustomEvent("production_update", { detail: msg.data }));
        }
      } catch {
        // malformed frame — ignore
      }
    };

    ws.onclose = () => {
      // Exponential back-off reconnect (max 30s)
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      reconnectTimer.current = setTimeout(connect, Math.min(30_000, 3_000));
    };

    ws.onerror = () => ws.close();
  }, [isAuthenticated]);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
  }, [connect]);

  return { unreadCount, notifications, markRead, markAllRead };
}
