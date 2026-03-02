import { useState } from "react";
import { MapPin, Navigation, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useLocation } from "../Root";

interface LocationBottomSheetProps {
  onClose: () => void;
}

export default function LocationBottomSheet({ onClose }: LocationBottomSheetProps) {
  const { location, setLocation, setUserCoords } = useLocation();
  const [customLocation, setCustomLocation] = useState("");
  const [isDetecting, setIsDetecting] = useState(false);

  const popularLocations = [
    "My Neighbourhood",
    "Downtown",
    "City Centre",
    "Suburbs",
  ];

  const handleUseCurrentLocation = () => {
    setIsDetecting(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            // Try reverse geocoding via a free API
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
            const data = await res.json();
            const addr = data.address;
            const locationName = addr?.suburb
              ? `${addr.suburb}, ${addr.city || addr.town || ''}`
              : addr?.city || addr?.town || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
            setLocation(locationName.trim().replace(/,\s*$/, ''));
          } catch {
            setLocation(`Near me`);
          }
          setIsDetecting(false);
          onClose();
        },
        () => {
          setLocation("Location unavailable");
          setIsDetecting(false);
          onClose();
        },
        { timeout: 10000 }
      );
    } else {
      setLocation("Location unavailable");
      setIsDetecting(false);
      onClose();
    }
  };

  const handleSelectLocation = async (loc: string) => {
    setIsDetecting(true);
    try {
      // Find coordinates for this location string using Nominatim search
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(loc + ', Zimbabwe')}&format=json&limit=1`);
      const data = await res.json();
      if (data && data.length > 0) {
        setUserCoords([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
      }
    } catch (e) {
      console.error("Geocoding failed", e);
    }
    setLocation(loc);
    setIsDetecting(false);
    onClose();
  };

  const handleCustomLocation = async () => {
    if (customLocation.trim()) {
      setIsDetecting(true);
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(customLocation + ', Zimbabwe')}&format=json&limit=1`);
        const data = await res.json();
        if (data && data.length > 0) {
          setUserCoords([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
        }
      } catch (e) {
        console.error("Geocoding failed", e);
      }
      setLocation(customLocation);
      setIsDetecting(false);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/40"
          onClick={onClose}
        />

        {/* Bottom Sheet */}
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 30, stiffness: 300 }}
          className="relative w-full sm:max-w-lg sm:mx-4 bg-white sm:rounded-[40px] rounded-t-[40px] p-6 glass-morphism max-h-[90vh] overflow-y-auto"
        >
          {/* Handle Bar (mobile only) */}
          <div className="sm:hidden w-12 h-1.5 bg-[#E2E8F0] rounded-full mx-auto mb-6" />

          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-[#0F172A]">Set Your Bridge</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-[#F1F5F9] rounded-[12px] transition-colors"
            >
              <X className="w-6 h-6 text-[#64748B]" />
            </button>
          </div>

          {/* Current Location */}
          <button
            onClick={handleUseCurrentLocation}
            disabled={isDetecting}
            className="w-full flex items-center justify-center space-x-3 p-4 bg-gradient-to-br from-[#1E40AF] to-[#065F46] text-white rounded-[32px] hover:opacity-90 transition-opacity mb-6 disabled:opacity-70"
          >
            <div className="relative">
              <Navigation className="w-5 h-5" />
              {isDetecting && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-[#10B981] rounded-full pulse-dot" />
              )}
            </div>
            <span className="font-medium">
              {isDetecting ? "Detecting Location..." : "Use Current Location"}
            </span>
          </button>

          {/* Manual Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-[#64748B] mb-2">
              Or enter manually
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={customLocation}
                onChange={(e) => setCustomLocation(e.target.value)}
                placeholder="Enter neighborhood or street"
                className="flex-1 px-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[24px] focus:outline-none focus:border-[#1E40AF] transition-colors"
              />
              <button
                onClick={handleCustomLocation}
                className="px-6 py-3 bg-[#1E40AF] text-white rounded-[24px] hover:bg-[#1e3a8a] transition-colors"
              >
                Set
              </button>
            </div>
          </div>

          {/* Popular Locations */}
          <div>
            <h3 className="text-sm font-medium text-[#64748B] mb-3">Popular Locations</h3>
            <div className="grid grid-cols-2 gap-3">
              {popularLocations.map((loc) => (
                <button
                  key={loc}
                  onClick={() => handleSelectLocation(loc)}
                  className={`p-4 rounded-[24px] text-left transition-all ${location === loc
                    ? "bg-gradient-to-br from-[#1E40AF] to-[#065F46] text-white"
                    : "bg-[#F8FAFC] hover:bg-[#F1F5F9] text-[#0F172A]"
                    }`}
                >
                  <div className="flex items-start space-x-2">
                    <MapPin className={`w-4 h-4 mt-0.5 flex-shrink-0 ${location === loc ? "text-white" : "text-[#1E40AF]"
                      }`} />
                    <span className="text-sm font-medium">{loc}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
