import { useState } from "react";
import { Link, useLocation as useRouterLocation } from "react-router";
import { MapPin, Menu, X, User, Coins, Home, Briefcase, Sun, Moon, Package } from "lucide-react";
import { useLocation } from "../Root";
import LocationBottomSheet from "./LocationBottomSheet";
import UserProfileDropdown from "./UserProfileDropdown";
import CartSidebar from "../cart/CartSidebar";
import NotificationCenter from "./NotificationCenter";

export default function Navigation() {
  const { location, userRole, theme, toggleTheme } = useLocation();
  const routerLocation = useRouterLocation();
  const [showLocationSheet, setShowLocationSheet] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  // Hide navigation on onboarding and auth screens
  if (routerLocation.pathname === "/" || routerLocation.pathname === "/auth") {
    return null;
  }

  return (
    <>
      <nav className="sticky top-0 z-50 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/marketplace" className="flex items-center space-x-2">
              <img src="/logo.png" alt="LocalConnect Logo" className="w-10 h-10 object-contain rounded-[12px]" />
              <span className="font-bold text-xl text-slate-900 dark:text-white">LocalConnect</span>
            </Link>

            {/* Location Indicator */}
            <button
              onClick={() => setShowLocationSheet(true)}
              className="hidden sm:flex items-center space-x-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-[24px] transition-colors"
            >
              <MapPin className={`w-4 h-4 ${location ? "text-blue-600" : "text-slate-400 animate-pulse"}`} />
              <span className={`text-sm font-medium ${location ? "text-[#0F172A]" : "text-slate-400"}`}>
                {location || "Detecting location..."}
              </span>
            </button>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-6">
              <Link
                to="/marketplace"
                className={`text-sm font-medium transition-colors ${routerLocation.pathname === "/marketplace"
                  ? "text-blue-600"
                  : "text-slate-500 hover:text-blue-600"
                  }`}
              >
                Marketplace
              </Link>

              <Link
                to="/orders"
                className={`text-sm font-medium transition-colors ${routerLocation.pathname === "/orders"
                  ? "text-blue-600"
                  : "text-slate-500 hover:text-blue-600"
                  }`}
              >
                My Orders
              </Link>

              {userRole === "system-admin" && (
                <Link
                  to="/admin"
                  className={`text-sm font-medium transition-colors ${routerLocation.pathname === "/admin"
                    ? "text-blue-600"
                    : "text-slate-500 hover:text-blue-600"
                    }`}
                >
                  Admin
                </Link>
              )}

              {userRole === "shop-owner" && (
                <Link
                  to="/shop-owner"
                  className={`text-sm font-medium transition-colors ${routerLocation.pathname === "/shop-owner"
                    ? "text-blue-600"
                    : "text-slate-500 hover:text-blue-600"
                    }`}
                >
                  My Shop
                </Link>
              )}

              {userRole === "ambassador" && (
                <Link
                  to="/ambassador"
                  className={`text-sm font-medium transition-colors ${routerLocation.pathname === "/ambassador"
                    ? "text-blue-600"
                    : "text-slate-500 hover:text-blue-600"
                    }`}
                >
                  Ambassador
                </Link>
              )}

              {/* Notifications */}
              <NotificationCenter />

              {/* Dark Mode Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {theme === 'dark' ? (
                  <Sun className="w-5 h-5 text-amber-400" />
                ) : (
                  <Moon className="w-5 h-5 text-slate-600" />
                )}
              </button>

              {/* User Profile */}
              <div className="relative">
                <button
                  onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                  className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-br from-[#1E40AF] to-[#1e3a8a] text-white rounded-[24px] hover:opacity-90 transition-opacity"
                >
                  <User className="w-4 h-4" />
                  <span className="text-sm">Profile</span>
                </button>

                {showProfileDropdown && (
                  <UserProfileDropdown onClose={() => setShowProfileDropdown(false)} />
                )}
              </div>

              {/* Cart */}
              <CartSidebar />
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center space-x-2">
              <CartSidebar />
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 rounded-[12px] hover:bg-slate-100 transition-colors"
              >
                {showMenu ? (
                  <X className="w-6 h-6 text-[#0F172A]" />
                ) : (
                  <Menu className="w-6 h-6 text-[#0F172A]" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Location on navbar for small screens */}
          <div className="sm:hidden pb-3">
            <button
              onClick={() => setShowLocationSheet(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-[24px] transition-colors w-full justify-center"
            >
              <MapPin className={`w-4 h-4 ${location ? "text-blue-600" : "text-slate-400 animate-pulse"}`} />
              <span className={`text-sm font-medium ${location ? "text-[#0F172A]" : "text-slate-400"}`}>
                {location || "Detecting location..."}
              </span>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {showMenu && (
          <div className="md:hidden border-t border-slate-200 bg-white">
            <div className="px-4 py-4 space-y-3">
              <Link
                to="/marketplace"
                className="block px-4 py-3 rounded-[16px] text-[#0F172A] hover:bg-slate-100 transition-colors"
                onClick={() => setShowMenu(false)}
              >
                Marketplace
              </Link>

              <Link
                to="/orders"
                className="block px-4 py-3 rounded-[16px] text-[#0F172A] hover:bg-slate-100 transition-colors"
                onClick={() => setShowMenu(false)}
              >
                My Orders
              </Link>

              {userRole === "system-admin" && (
                <Link
                  to="/admin"
                  className="block px-4 py-3 rounded-[16px] text-[#0F172A] hover:bg-slate-100 transition-colors"
                  onClick={() => setShowMenu(false)}
                >
                  Admin Dashboard
                </Link>
              )}

              {userRole === "shop-owner" && (
                <Link
                  to="/shop-owner"
                  className="block px-4 py-3 rounded-[16px] text-[#0F172A] hover:bg-slate-100 transition-colors"
                  onClick={() => setShowMenu(false)}
                >
                  My Shop
                </Link>
              )}

              {userRole === "ambassador" && (
                <Link
                  to="/ambassador"
                  className="block px-4 py-3 rounded-[16px] text-[#0F172A] hover:bg-slate-100 transition-colors"
                  onClick={() => setShowMenu(false)}
                >
                  Ambassador Portal
                </Link>
              )}

              <div className="pt-3 border-t border-slate-200">
                <button
                  onClick={() => {
                    setShowMenu(false);
                    setShowProfileDropdown(true);
                  }}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-br from-[#1E40AF] to-[#1e3a8a] text-white rounded-[24px]"
                >
                  <User className="w-4 h-4" />
                  <span>View Profile</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Location Bottom Sheet */}
      {showLocationSheet && (
        <LocationBottomSheet onClose={() => setShowLocationSheet(false)} />
      )}
    </>
  );
}
