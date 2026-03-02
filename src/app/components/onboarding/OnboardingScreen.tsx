import { useState } from "react";
import { useNavigate } from "react-router";
import { MapPin, Navigation, ArrowRight, Search, Compass, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import { useLocation } from "../Root";

export default function OnboardingScreen() {
  const navigate = useNavigate();
  const { setLocation } = useLocation();
  const [customLocation, setCustomLocation] = useState("");
  const [isDetecting, setIsDetecting] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);

  const regions = [
    {
      city: "Bulawayo",
      areas: ["Selborne", "Pumula", "Hillside", "Nkulumane"],
      color: "from-emerald-500 to-emerald-700",
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      border: "border-emerald-200",
      dot: "bg-emerald-500",
    },
    {
      city: "Harare",
      areas: ["Mbare", "Avondale", "Borrowdale", "Mount Pleasant"],
      color: "from-blue-500 to-blue-700",
      bg: "bg-blue-50",
      text: "text-blue-700",
      border: "border-blue-200",
      dot: "bg-blue-500",
    },
  ];

  const handleUseCurrentLocation = () => {
    setIsDetecting(true);
    setTimeout(() => {
      setLocation("Bulawayo");
      setIsDetecting(false);
      navigate("/auth");
    }, 2000);
  };

  const handleSelectLocation = (loc: string) => {
    setSelectedLocation(loc);
    setLocation(loc);
    setTimeout(() => navigate("/auth"), 300);
  };

  const handleCustomLocation = () => {
    if (customLocation.trim()) {
      setLocation(customLocation);
      navigate("/auth");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 font-sans">
      <div className="w-full max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

        {/* Left Side — Brand & Info */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="hidden lg:flex flex-col justify-center space-y-8"
        >
          {/* Logo */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
            className="w-16 h-16 rounded-[16px] flex items-center justify-center shadow-lg shadow-blue-500/20 overflow-hidden bg-white"
          >
            <img src="/logo.png" alt="LocalConnect Logo" className="w-full h-full object-contain" />
          </motion.div>

          <div className="space-y-4">
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 leading-tight">
              Your <span className="text-blue-600">Community</span>,<br />
              One Tap Away.
            </h1>
            <p className="text-lg text-slate-500 max-w-md leading-relaxed">
              Set your location to discover shops, deals, and neighbors near you.
              LocalConnect makes local commerce personal.
            </p>
          </div>

          {/* Stats */}
          <div className="flex space-x-6">
            {[
              { val: "500+", label: "Local Shops" },
              { val: "12K", label: "Residents" },
              { val: "2", label: "Cities" },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + i * 0.1 }}
              >
                <div className="text-2xl font-bold text-slate-900">{stat.val}</div>
                <div className="text-sm text-slate-400">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Right Side — Location Card */}
        <div className="w-full max-w-md mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-[32px] shadow-xl border border-slate-100 overflow-hidden"
          >
            {/* Header */}
            <div className="p-8 pb-5">
              <div className="lg:hidden mb-6">
                <div className="w-12 h-12 bg-white rounded-[12px] flex items-center justify-center shadow-md shadow-blue-500/20 overflow-hidden">
                  <img src="/logo.png" alt="LocalConnect Logo" className="w-full h-full object-contain" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Set Your Location</h2>
              <p className="text-slate-500 mt-1 text-sm">Pick your area to see what's nearby</p>
            </div>

            {/* Auto-detect Button */}
            <div className="px-8 pb-4">
              <button
                onClick={handleUseCurrentLocation}
                disabled={isDetecting}
                className="w-full flex items-center p-4 rounded-2xl border-2 border-dashed border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all group"
              >
                <div className="relative mr-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${isDetecting ? "bg-emerald-100" : "bg-slate-100 group-hover:bg-blue-100"}`}>
                    {isDetecting ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      >
                        <Compass className="w-5 h-5 text-emerald-600" />
                      </motion.div>
                    ) : (
                      <Navigation className="w-5 h-5 text-slate-500 group-hover:text-blue-600 transition-colors" />
                    )}
                  </div>
                  {isDetecting && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                    </span>
                  )}
                </div>
                <div className="text-left flex-1">
                  <div className="font-semibold text-slate-900 text-sm">
                    {isDetecting ? "Detecting..." : "Use Current Location"}
                  </div>
                  <div className="text-xs text-slate-400">
                    {isDetecting ? "Finding your area" : "Allow GPS to auto-detect"}
                  </div>
                </div>
                {!isDetecting && (
                  <Sparkles className="w-4 h-4 text-slate-300 group-hover:text-blue-400 transition-colors" />
                )}
              </button>
            </div>

            {/* Divider */}
            <div className="flex items-center px-8 py-2">
              <div className="flex-1 h-px bg-slate-100" />
              <span className="px-3 text-xs font-medium text-slate-400 uppercase tracking-wider">or choose</span>
              <div className="flex-1 h-px bg-slate-100" />
            </div>

            {/* Region Cards */}
            <div className="px-6 pb-2 space-y-4">
              {regions.map((region, ri) => (
                <motion.div
                  key={region.city}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + ri * 0.15 }}
                >
                  <div className="mb-2 flex items-center px-2">
                    <div className={`w-2 h-2 rounded-full ${region.dot} mr-2`} />
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{region.city}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {region.areas.map((area) => {
                      const fullName = `${area}, ${region.city}`;
                      const isSelected = selectedLocation === fullName;
                      return (
                        <button
                          key={area}
                          onClick={() => handleSelectLocation(fullName)}
                          className={`flex items-center p-3 rounded-xl text-left transition-all text-sm
                            ${isSelected
                              ? `${region.bg} ${region.text} ${region.border} border font-semibold scale-[0.98]`
                              : "bg-slate-50 text-slate-700 border border-transparent hover:bg-slate-100 hover:border-slate-200"
                            }`}
                        >
                          <MapPin className={`w-3.5 h-3.5 mr-2 flex-shrink-0 ${isSelected ? region.text : "text-slate-400"}`} />
                          <span className="truncate">{area}</span>
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Search / Custom Input */}
            <div className="p-6 pt-4">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                <input
                  type="text"
                  value={customLocation}
                  onChange={(e) => setCustomLocation(e.target.value)}
                  placeholder="Search other areas..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-11 pr-12 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-sm font-medium text-slate-900"
                  onKeyDown={(e) => e.key === "Enter" && handleCustomLocation()}
                />
                {customLocation.trim() && (
                  <button
                    onClick={handleCustomLocation}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 active:scale-95 transition-all"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </motion.div>

          {/* Footer */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-center text-slate-400 text-xs mt-6"
          >
            By continuing, you agree to our Terms & Privacy Policy
          </motion.p>
        </div>
      </div>
    </div>
  );
}
