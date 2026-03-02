import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, CircleMarker, Tooltip as LeafletTooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { api } from "../../../services/api";
import { toast } from "sonner";
import { AlertTriangle } from "lucide-react";

// Fix leaflet icon paths
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface HeatmapPoint {
    lat: number;
    lng: number;
    intensity: number;
}

export default function DemandHeatmap() {
    const [heatmapData, setHeatmapData] = useState<HeatmapPoint[]>([]);
    const [loading, setLoading] = useState(true);

    // Center on Harare by default
    const defaultCenter: [number, number] = [-17.8216, 31.0492];

    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await api.getAdminHeatmap();
                setHeatmapData(data);
            } catch (error) {
                console.error("Failed to load heatmap data", error);
                toast.error("Failed to load demand heatmap");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const validData = heatmapData.filter((d) => d.lat != null && d.lng != null);

    // Calculate intensity scale
    const maxIntensity = Math.max(...validData.map((d) => d.intensity), 1);

    const getHeatColor = (intensity: number) => {
        const ratio = intensity / maxIntensity;
        if (ratio > 0.7) return "#EF4444"; // Red
        if (ratio > 0.4) return "#F59E0B"; // Orange
        return "#10B981"; // Green
    };

    const getRadius = (intensity: number) => {
        const ratio = intensity / maxIntensity;
        return 15 + ratio * 30; // 15 to 45 px radius
    };

    return (
        <div className="flex flex-col space-y-4">
            <div className="flex items-center justify-between mb-2">
                <div>
                    <h2 className="text-xl font-bold text-[#0F172A] mb-1">Geospatial Demand Heatmap</h2>
                    <p className="text-sm text-[#64748B]">Visualizing community order density in real-time</p>
                </div>
                {loading && <div className="text-sm text-[#1E40AF] animate-pulse">Loading map data...</div>}
            </div>

            <div className="relative w-full h-[500px] bg-[#F8FAFC] rounded-[24px] overflow-hidden shadow-sm border border-[#E2E8F0] z-0">
                <MapContainer
                    center={defaultCenter}
                    zoom={12}
                    scrollWheelZoom={false}
                    style={{ height: "100%", width: "100%" }}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                    />

                    {validData.map((point, idx) => {
                        const color = getHeatColor(point.intensity);
                        const radius = getRadius(point.intensity);
                        const ratio = point.intensity / maxIntensity;

                        return (
                            <CircleMarker
                                key={idx}
                                center={[point.lat, point.lng]}
                                pathOptions={{
                                    color: color,
                                    fillColor: color,
                                    fillOpacity: 0.4 + (ratio * 0.4), // 0.4 to 0.8
                                    weight: 2,
                                }}
                                radius={radius}
                            >
                                <LeafletTooltip>
                                    <div className="font-semibold text-slate-800">
                                        Demand Intensity: {point.intensity} order(s)
                                    </div>
                                </LeafletTooltip>
                            </CircleMarker>
                        );
                    })}
                </MapContainer>
            </div>

            {/* Legend */}
            <div className="bg-[#F8FAFC] rounded-[24px] p-6 grid grid-cols-1 md:grid-cols-3 gap-4 border border-[#E2E8F0]">
                <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 bg-[#EF4444] rounded-full opacity-80" />
                    <span className="text-sm font-medium text-[#0F172A]">High Demand (Hotspot)</span>
                </div>
                <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 bg-[#F59E0B] rounded-full opacity-60" />
                    <span className="text-sm font-medium text-[#0F172A]">Medium Demand</span>
                </div>
                <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 bg-[#10B981] rounded-full opacity-40" />
                    <span className="text-sm font-medium text-[#0F172A]">Emerging Demand</span>
                </div>
            </div>
        </div>
    );
}
