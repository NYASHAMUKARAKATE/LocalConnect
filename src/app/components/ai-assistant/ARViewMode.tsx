import React, { useEffect, useRef, useState } from "react";
import { X, Navigation, MapPin, Store } from "lucide-react";
import { motion } from "motion/react";
import { useLocation } from "../Root";
import { api } from "../../../services/api";
import { toast } from "sonner";

interface ARViewModeProps {
  onClose: () => void;
}

interface ARShop {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  distanceMeter: number;
  distanceStr: string;
  bearing: number; // 0-360 true north bearing from user to shop
}

// Haversine formula to get distance in meters
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3; // Earth radius in meters
  const p1 = lat1 * Math.PI / 180;
  const p2 = lat2 * Math.PI / 180;
  const dp = (lat2 - lat1) * Math.PI / 180;
  const dl = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(dp / 2) * Math.sin(dp / 2) +
    Math.cos(p1) * Math.cos(p2) *
    Math.sin(dl / 2) * Math.sin(dl / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Calculate bearing from user to shop (0 to 360 degrees)
function getBearing(lat1: number, lon1: number, lat2: number, lon2: number) {
  const l1 = lat1 * Math.PI / 180;
  const l2 = lat2 * Math.PI / 180;
  const dl = (lon2 - lon1) * Math.PI / 180;

  const y = Math.sin(dl) * Math.cos(l2);
  const x = Math.cos(l1) * Math.sin(l2) -
    Math.sin(l1) * Math.cos(l2) * Math.cos(dl);

  let brng = Math.atan2(y, x);
  brng = brng * 180 / Math.PI;
  return (brng + 360) % 360;
}

export default function ARViewMode({ onClose }: ARViewModeProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraError, setCameraError] = useState(false);
  const [heading, setHeading] = useState<number | null>(null); // phone's compass heading 0-360
  const [shops, setShops] = useState<ARShop[]>([]);
  const { userCoords } = useLocation();

  useEffect(() => {
    let stream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" }
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Camera access denied or unavailable", err);
        setCameraError(true);
      }
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Fetch real shops and calculate distances/bearings
  useEffect(() => {
    const loadShops = async () => {
      try {
        const data = await api.getAllShops();
        const userLat = userCoords[0];
        const userLng = userCoords[1];

        const processed: ARShop[] = data
          .filter((s: any) => s.latitude && s.longitude)
          .map((s: any) => {
            const dist = getDistance(userLat, userLng, s.latitude, s.longitude);
            const distStr = dist > 1000 ? `${(dist / 1000).toFixed(1)}km` : `${Math.round(dist)}m`;
            const bearing = getBearing(userLat, userLng, s.latitude, s.longitude);
            return {
              id: s.id,
              name: s.name,
              latitude: s.latitude,
              longitude: s.longitude,
              distanceMeter: dist,
              distanceStr: distStr,
              bearing: bearing
            };
          });

        // Sort by closest first, take top 20 to avoid cluttered AR
        processed.sort((a, b) => a.distanceMeter - b.distanceMeter);
        setShops(processed.slice(0, 20));
      } catch (e) {
        console.error("Failed to load AR shops", e);
        toast.error("Failed to load nearby shops for AR");
      }
    };
    loadShops();
  }, [userCoords]);

  // Compass integration
  useEffect(() => {
    const handleOrientation = (event: DeviceOrientationEvent) => {
      // webkitCompassHeading is for iOS, alpha is standard absolute. 
      // Note: 'alpha' might not always be true North depending on browser, but it's the standard.
      let h = null;
      if ((event as any).webkitCompassHeading) {
        h = (event as any).webkitCompassHeading;
      } else if (event.alpha !== null && event.absolute) {
        h = 360 - event.alpha; // standard alpha goes counter-clockwise, compass heading goes clockwise
      } else if (event.alpha !== null) {
        // Fallback for non-absolute alpha (might drift)
        h = 360 - event.alpha;
      }

      if (h !== null) {
        setHeading(h);
      }
    };

    // Note: iOS 13+ requires requesting permission first via DeviceOrientationEvent.requestPermission()
    // For simplicity in this demo, we assume standard listeners.
    window.addEventListener("deviceorientationabsolute", handleOrientation as any, true);
    window.addEventListener("deviceorientation", handleOrientation as any, true);

    return () => {
      window.removeEventListener("deviceorientationabsolute", handleOrientation as any, true);
      window.removeEventListener("deviceorientation", handleOrientation as any, true);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#334155]">
      {/* AR Camera View Simulation */}
      <div className="absolute inset-0 flex items-center justify-center">
        {/* CAMERA Background */}
        <div className="absolute inset-0 bg-black overflow-hidden flex items-center justify-center">
          {cameraError ? (
            <div className="text-white text-center p-6">
              <Store className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <p>Camera access is disabled or unavailable.</p>
              <p className="text-sm text-slate-400 mt-2">Please check browser permissions to use AR Mode.</p>
            </div>
          ) : (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute min-w-full min-h-full object-cover opacity-90"
            />
          )}
        </div>

        {/* AR Grid Overlay Effect over video */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="w-full h-full" style={{
            backgroundImage: `
            linear-gradient(0deg, transparent 24%, rgba(255, 255, 255, .05) 25%, rgba(255, 255, 255, .05) 26%, transparent 27%, transparent 74%, rgba(255, 255, 255, .05) 75%, rgba(255, 255, 255, .05) 76%, transparent 77%, transparent),
            linear-gradient(90deg, transparent 24%, rgba(255, 255, 255, .05) 25%, rgba(255, 255, 255, .05) 26%, transparent 27%, transparent 74%, rgba(255, 255, 255, .05) 75%, rgba(255, 255, 255, .05) 76%, transparent 77%, transparent)
          `,
            backgroundSize: '50px 50px'
          }} />
        </div>

        {/* AR Direction Indicators */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Center Crosshair */}
          <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="w-16 h-16 border-2 border-[#10B981] rounded-full flex items-center justify-center">
              <Navigation className="w-8 h-8 text-[#10B981]" />
            </div>
          </div>

          {heading === null && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 mt-12 text-white/50 text-sm">
              Waiting for compass sensor...
            </div>
          )}

          {/* Render Real Shops plotted by Heading */}
          {shops.map((shop, idx) => {
            // Find difference between our heading and the shop's true bearing
            // FOV (Field of view) is roughly 60 degrees.
            // If diff = 0, it's center. diff = -30 is far left, diff = +30 is far right.
            let diff = 0;
            if (heading !== null) {
              diff = shop.bearing - heading;
              if (diff > 180) diff -= 360;
              if (diff < -180) diff += 360;
            }

            // If abs(diff) > 40, it's roughly off screen, don't render to save DOM clutter
            if (heading !== null && Math.abs(diff) > 45) return null;

            // Map diff (-30 to +30) to left percentage (0% to 100%)
            // 0 -> 50%, -30 -> 0%, +30 -> 100%
            const leftPct = heading === null ? 50 : 50 + (diff * (50 / 30));

            // Stagger the vertical height so they don't overlap as easily
            const topPct = 30 + (idx % 3) * 15;

            return (
              <motion.div
                key={shop.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1, left: `${leftPct}%`, top: `${topPct}%` }}
                transition={{ type: "spring", stiffness: 100, damping: 20 }}
                className="absolute pointer-events-auto"
                style={{
                  transform: 'translate(-50%, -50%)',
                }}
              >
                <div className="relative">
                  {/* Shop Marker */}
                  <div className="relative bg-white/95 backdrop-blur-md rounded-[24px] p-4 shadow-2xl min-w-[200px]">
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-[#1E40AF] to-[#065F46] rounded-[12px] flex items-center justify-center flex-shrink-0">
                        <Store className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-[#0F172A] text-sm mb-1 line-clamp-1">
                          {shop.name}
                        </h3>
                        <div className="flex items-center space-x-2 text-xs">
                          <div className="flex items-center space-x-1 text-[#1E40AF] font-semibold">
                            <MapPin className="w-3 h-3" />
                            <span>{shop.distanceStr}</span>
                          </div>
                          <span className="text-[#64748B]">•</span>
                          <span className="text-[#64748B] font-medium">{Math.round(shop.bearing)}°</span>
                        </div>
                      </div>
                    </div>

                    <motion.div
                      animate={{ y: [0, -5, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="absolute -bottom-6 left-1/2 transform -translate-x-1/2"
                    >
                      <div className="w-0 h-0 border-l-8 border-l-transparent border-r-8 border-r-transparent border-t-8 border-t-white/95" />
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-6 z-10 pointer-events-none">
        <div className="flex items-center justify-between">
          <div className="glass-morphism rounded-[24px] px-6 py-3">
            <h2 className="text-white font-bold">AR View Mode</h2>
            <p className="text-white/70 text-xs mt-1">
              Heading: {heading !== null ? `${Math.round(heading)}°` : 'Detecting...'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="pointer-events-auto bg-black/50 backdrop-blur-md border border-white/20 w-12 h-12 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>
      </div>

      {/* Bottom Instructions */}
      <div className="absolute bottom-6 left-6 right-6 z-10 pointer-events-none">
        <div className="bg-black/40 backdrop-blur-md rounded-[32px] border border-white/10 p-6 text-center">
          <p className="text-white text-sm mb-3">
            Physically rotate your device to explore {shops.length} verified shops around you based on your GPS location.
          </p>
          <div className="flex items-center justify-center space-x-6">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-[#1E40AF] rounded-full" />
              <span className="text-white text-xs font-medium">Available</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-[#10B981] rounded-full" />
              <span className="text-white text-xs font-medium">Your Direction</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
