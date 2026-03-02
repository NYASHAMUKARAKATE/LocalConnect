import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix leaflet icon paths for Vite/Webpack environments
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export interface MapShop {
    id: number;
    name: string;
    latitude: number;
    longitude: number;
    location?: string;
    distance?: string;
}

interface MapViewProps {
    userLocation: [number, number]; // [lat, lng]
    shops: MapShop[];
    onShopClick?: (shopId: number, shopName: string) => void;
}

const createUserMarker = () => {
    return L.divIcon({
        className: 'custom-user-marker bg-transparent border-none',
        html: `
            <div class="relative flex items-center justify-center w-12 h-12">
                <div class="absolute w-full h-full bg-emerald-500 rounded-full opacity-20 animate-ping"></div>
                <div class="relative w-8 h-8 bg-emerald-500 border-2 border-white rounded-full shadow-lg flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
                </div>
            </div>
        `,
        iconSize: [48, 48],
        iconAnchor: [24, 24],
    });
};

const createShopMarker = (shop: MapShop) => {
    return L.divIcon({
        className: 'custom-shop-marker bg-transparent border-none',
        html: `
            <div class="flex items-center bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] p-2 pr-4 w-[240px] h-[64px] relative cursor-pointer hover:shadow-lg transition-shadow">
                <div class="w-12 h-12 rounded-[20px] bg-gradient-to-br from-[#0F172A] to-[#065F46] flex flex-col items-center justify-center shrink-0 mr-3 text-white">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/><path d="M22 7v3a2 2 0 0 1-2 2v0a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12v0a2 2 0 0 1-2-2V7"/></svg>
                </div>
                <div class="flex flex-col overflow-hidden w-full">
                    <span class="font-bold text-slate-800 text-[15px] truncate leading-tight">${shop.name}</span>
                    <div class="flex items-center text-[13px] text-slate-500 mt-0.5 space-x-1 w-full">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-blue-600 shrink-0"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg>
                        <span class="shrink-0 text-blue-600 font-medium">${shop.distance || 'Nearby'}</span>
                        ${shop.location ? `<span class="w-1 h-1 rounded-full bg-slate-300 shrink-0 mx-1"></span><span class="truncate pr-1">${shop.location}</span>` : ''}
                    </div>
                </div>
                <!-- Caret -->
                <div class="absolute -bottom-[6px] left-1/2 -translate-x-1/2 w-4 h-4 bg-white transform rotate-45 shadow-[inset_-2px_-2px_4px_rgba(0,0,0,0.04)]"></div>
            </div>
        `,
        iconSize: [240, 64],
        iconAnchor: [120, 70] // Center bottom, accommodating the caret
    });
};

function MapUpdater({ center, shops }: { center: [number, number], shops: MapShop[] }) {
    const map = useMap();
    useEffect(() => {
        if (shops && shops.length > 0) {
            const bounds = L.latLngBounds([center]);
            shops.forEach(s => {
                if (s.latitude != null && s.longitude != null) {
                    bounds.extend([s.latitude, s.longitude]);
                }
            });
            map.flyToBounds(bounds, { padding: [50, 50], maxZoom: 14, duration: 1.5 });
        } else {
            map.flyTo(center, 13, { duration: 1.5 });
        }
    }, [center, shops, map]);
    return null;
}

export default function MapView({ userLocation, shops, onShopClick }: MapViewProps) {
    // Filter out shops without valid coordinates
    const validShops = shops.filter(s => s.latitude != null && s.longitude != null);

    return (
        <div className="h-[350px] w-full rounded-2xl overflow-hidden shadow-sm border border-slate-200 my-4 relative z-0">
            <MapContainer
                center={userLocation}
                zoom={13}
                scrollWheelZoom={false}
                style={{ height: '100%', width: '100%' }}
            >
                <MapUpdater center={userLocation} shops={validShops} />
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                />

                {/* User Location Marker */}
                <Marker position={userLocation} icon={createUserMarker()} />

                {/* Shop Markers */}
                {validShops.map(shop => (
                    <Marker
                        key={shop.id}
                        position={[shop.latitude, shop.longitude]}
                        icon={createShopMarker(shop)}
                        eventHandlers={{
                            click: () => onShopClick && onShopClick(shop.id, shop.name)
                        }}
                    />
                ))}
            </MapContainer>
        </div>
    );
}
