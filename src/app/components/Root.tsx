import { Outlet } from "react-router";
import { useState, createContext, useContext } from "react";
import Navigation from "./navigation/Navigation";
import { CartProvider } from "../contexts/CartContext";
import { NotificationProvider } from "../contexts/NotificationContext";
import { I18nProvider } from "../../i18n";
import { Toaster } from "sonner";
import ErrorBoundary from "./ErrorBoundary";

import { useEffect } from "react";
import { api } from "../../services/api";

interface LocationContextType {
  location: string;
  setLocation: (location: string) => void;
  userCoords: [number, number];
  setUserCoords: (coords: [number, number]) => void;
  userRole: "guest" | "system-admin" | "shop-owner" | "resident" | "ambassador";
  setUserRole: (role: "guest" | "system-admin" | "shop-owner" | "resident" | "ambassador") => void;
  userId: number | null;
  setUserId: (id: number | null) => void;
  isAuthenticated: boolean;
  login: (token: string, role: any, id: number) => void;
  logout: () => void;
  credits: number;
  theme: "light" | "dark";
  toggleTheme: () => void;
}

export const LocationContext = createContext<LocationContextType>({
  location: "",
  setLocation: () => { },
  userCoords: [-17.8252, 31.0335],
  setUserCoords: () => { },
  userRole: "guest",
  setUserRole: () => { },
  userId: null,
  setUserId: () => { },
  isAuthenticated: false,
  login: () => { },
  logout: () => { },
  credits: 0,
  theme: "light",
  toggleTheme: () => { },
});

export const useLocation = () => useContext(LocationContext);

export default function Root() {
  const [location, setLocation] = useState(() => {
    return localStorage.getItem("userLocation") || "";
  });
  const [userCoords, setUserCoords] = useState<[number, number]>(() => {
    const stored = localStorage.getItem("userCoords");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length === 2) return parsed as [number, number];
      } catch (e) { }
    }
    return [-17.8252, 31.0335]; // Default to Harare
  });

  // Watch for coordinate changes and persist them
  useEffect(() => {
    localStorage.setItem("userCoords", JSON.stringify(userCoords));
  }, [userCoords]);
  const [userRole, setUserRole] = useState<"guest" | "system-admin" | "shop-owner" | "resident" | "ambassador">("guest");
  const [userId, setUserId] = useState<number | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [credits, setCredits] = useState(0);
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    return (localStorage.getItem("theme") as "light" | "dark") || "light";
  });

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === "light" ? "dark" : "light";
      localStorage.setItem("theme", next);
      return next;
    });
  };

  useEffect(() => {
    const token = api.getAuthToken();
    if (token) {
      const storedRole = localStorage.getItem("userRole");
      const storedId = localStorage.getItem("userId");
      if (storedRole && storedId) {
        setUserRole(storedRole as any);
        setUserId(parseInt(storedId));
        setIsAuthenticated(true);
        api.getCurrentUser().then((u: any) => setCredits(u.credits || 0)).catch(console.error);
      }
    }
    // Register Service Worker for PWA
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => { });
    }
  }, []);

  // Auto-detect location on first load
  useEffect(() => {
    if (location) return; // Already set
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${position.coords.latitude}&lon=${position.coords.longitude}&format=json`
            );
            const data = await res.json();
            const suburb = data.address?.suburb || data.address?.neighbourhood || "";
            const city = data.address?.city || data.address?.town || "";
            const detected = [suburb, city].filter(Boolean).join(", ") || "Harare";
            setLocation(detected);
            setUserCoords([position.coords.latitude, position.coords.longitude]);
            localStorage.setItem("userLocation", detected);
          } catch {
            setLocation("Harare");
            setUserCoords([-17.8252, 31.0335]);
            localStorage.setItem("userLocation", "Harare");
          }
        },
        () => {
          setLocation("Harare");
          setUserCoords([-17.8252, 31.0335]);
          localStorage.setItem("userLocation", "Harare");
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      setLocation("Harare");
      localStorage.setItem("userLocation", "Harare");
    }
  }, [location]);

  const login = (token: string, role: any, id: number) => {
    api.setAuthToken(token);
    localStorage.setItem("userRole", role);
    localStorage.setItem("userId", id.toString());

    setUserRole(role);
    setUserId(id);
    setIsAuthenticated(true);
    api.getCurrentUser().then((u: any) => setCredits(u.credits || 0)).catch(console.error);
  };

  const logout = () => {
    api.setAuthToken("");
    api.setRefreshToken("");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userId");

    setUserRole("guest");
    setUserId(null);
    setIsAuthenticated(false);
  };

  return (
    <I18nProvider>
      <LocationContext.Provider value={{
        location, setLocation, userCoords, setUserCoords,
        userRole, setUserRole,
        userId, setUserId,
        isAuthenticated, login, logout,
        credits, theme, toggleTheme
      }}>
        <CartProvider>
          <NotificationProvider>
            <ErrorBoundary>
              <div className={`min-h-screen ${theme === 'dark' ? 'dark bg-slate-900' : 'bg-[#F8FAFC]'}`}>
                <Navigation />
                <main>
                  <Outlet />
                </main>
                <Toaster position="top-right" richColors />
              </div>
            </ErrorBoundary>
          </NotificationProvider>
        </CartProvider>
      </LocationContext.Provider>
    </I18nProvider>
  );
}