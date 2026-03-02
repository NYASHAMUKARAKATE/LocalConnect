import { createContext, useContext, useState, useCallback, ReactNode, useEffect, useRef } from "react";
import { toast } from "sonner";
import { useLocation } from "../components/Root";
import { API_URL } from "../../services/api";

export interface Notification {
    id: string;
    title: string;
    message: string;
    type: "info" | "success" | "warning" | "error";
    read: boolean;
    createdAt: Date;
}

interface NotificationContextType {
    notifications: Notification[];
    unreadCount: number;
    addNotification: (title: string, message: string, type?: Notification["type"]) => void;
    markAsRead: (id: string) => void;
    markAllAsRead: () => void;
    clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType>({
    notifications: [],
    unreadCount: 0,
    addNotification: () => { },
    markAsRead: () => { },
    markAllAsRead: () => { },
    clearAll: () => { },
});

export const useNotifications = () => useContext(NotificationContext);

export function NotificationProvider({ children }: { children: ReactNode }) {
    const { userRole } = useLocation();
    const ws = useRef<WebSocket | null>(null);

    const [notifications, setNotifications] = useState<Notification[]>([
        {
            id: "welcome",
            title: "Welcome to LocalConnect!",
            message: "Start exploring shops and products in your community.",
            type: "info",
            read: false,
            createdAt: new Date(),
        },
    ]);

    const unreadCount = notifications.filter((n) => !n.read).length;

    const addNotification = useCallback(
        (title: string, message: string, type: Notification["type"] = "info") => {
            const notification: Notification = {
                id: Date.now().toString(),
                title,
                message,
                type,
                read: false,
                createdAt: new Date(),
            };
            setNotifications((prev) => [notification, ...prev]);
        },
        []
    );

    // Dynamic Shop Owner WebSockets listener
    useEffect(() => {
        // Since we don't have the explicit shop_owner native ID inside the frontend LocationContext simply mapped yet (we only store the overarching DB Auth Token)
        // for this sandbox MVP we will parse an arbitrary ID to map the connection or decode the user JWT if it existed.
        // Assuming user ID 1 is the primary owner for tests.
        if (userRole === "shop-owner") {
            // Dynamically get the logged-in user ID
            const storedId = localStorage.getItem("userId");
            const shopOwnerId = storedId ? parseInt(storedId) : 1;


            // Build WebSocket URL from the base API url to handle different environments
            const baseApiUrl = API_URL || "http://127.0.0.1:8000/api";
            // Convert http:// to ws:// or https:// to wss://
            const wsBaseUrl = baseApiUrl.replace(/^http/, "ws");
            const wsUrl = `${wsBaseUrl}/notifications/ws/${shopOwnerId}`;

            ws.current = new WebSocket(wsUrl);

            ws.current.onopen = () => {
                console.log(`Connected to shop owner notification channels`);
            };

            ws.current.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.type === "new_order") {
                        // Throw up a global UI alert immediately, regardless of what route they're on
                        toast.success(data.message, {
                            duration: 10000,
                            position: "top-center"
                        });

                        // Push to the historical tray
                        addNotification("New Order Placed", data.message, "success");
                    }
                } catch (e) {
                    console.error("Malformed websocket msg", e);
                }
            };

            ws.current.onclose = () => {
                console.log("Disconnected from live notifications");
            };
        }

        return () => {
            if (ws.current) {
                ws.current.close();
            }
        };
    }, [userRole, addNotification]);

    const markAsRead = useCallback((id: string) => {
        setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, read: true } : n))
        );
    }, []);

    const markAllAsRead = useCallback(() => {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    }, []);

    const clearAll = useCallback(() => {
        setNotifications([]);
    }, []);

    return (
        <NotificationContext.Provider
            value={{ notifications, unreadCount, addNotification, markAsRead, markAllAsRead, clearAll }}
        >
            {children}
        </NotificationContext.Provider>
    );
}
