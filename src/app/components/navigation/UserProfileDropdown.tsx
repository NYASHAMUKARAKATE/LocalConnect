import { Coins, Home, Briefcase, LogOut, User, Package } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useLocation } from "../Root";
import { useNavigate } from "react-router";

interface UserProfileDropdownProps {
  onClose: () => void;
}

export default function UserProfileDropdown({ onClose }: UserProfileDropdownProps) {
  const { credits, userRole, logout } = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/auth");
    onClose();
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -10 }}
        transition={{ duration: 0.15 }}
        className="absolute right-0 mt-2 w-80 bg-white rounded-[32px] shadow-xl border border-[#E2E8F0] p-6 z-50"
      >
        {/* Credits Section */}
        <div className="bg-gradient-to-br from-[#1E40AF] to-[#065F46] rounded-[24px] p-6 mb-4">
          <div className="flex items-center justify-between text-white">
            <div>
              <p className="text-sm opacity-90 mb-1">Community Credits</p>
              <p className="text-3xl font-bold">{credits.toLocaleString()}</p>
            </div>
            <Coins className="w-10 h-10 opacity-80" />
          </div>
        </div>

        {/* Role Badge */}
        <div className="flex items-center justify-center mb-4">
          <span className="px-4 py-2 bg-[#F1F5F9] text-[#1E40AF] rounded-[16px] text-sm font-medium capitalize">
            {userRole.replace("-", " ")}
          </span>
        </div>

        {/* Quick Links */}
        <div className="space-y-2 mb-4">
          <h4 className="text-xs font-medium text-[#64748B] uppercase tracking-wide mb-3">
            Quick Links
          </h4>

          <button
            onClick={() => handleNavigate("/profile")}
            className="w-full flex items-center space-x-3 p-3 bg-[#F8FAFC] hover:bg-[#F1F5F9] rounded-[20px] transition-colors"
          >
            <div className="w-10 h-10 bg-white rounded-[12px] flex items-center justify-center">
              <User className="w-5 h-5 text-[#1E40AF]" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-medium text-[#0F172A]">My Profile</p>
              <p className="text-xs text-[#64748B]">Edit your information</p>
            </div>
          </button>

          <button
            onClick={() => handleNavigate("/orders")}
            className="w-full flex items-center space-x-3 p-3 bg-[#F8FAFC] hover:bg-[#F1F5F9] rounded-[20px] transition-colors"
          >
            <div className="w-10 h-10 bg-white rounded-[12px] flex items-center justify-center">
              <Package className="w-5 h-5 text-[#065F46]" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-medium text-[#0F172A]">My Orders</p>
              <p className="text-xs text-[#64748B]">View order history</p>
            </div>
          </button>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center space-x-2 p-3 border-2 border-[#E2E8F0] hover:border-[#EF4444] text-[#64748B] hover:text-[#EF4444] rounded-[20px] transition-all"
        >
          <LogOut className="w-4 h-4" />
          <span className="text-sm font-medium">Logout</span>
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
