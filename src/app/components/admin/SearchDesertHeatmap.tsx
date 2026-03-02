import { motion } from "motion/react";
import { AlertTriangle, TrendingUp } from "lucide-react";

interface SearchDesertHeatmapProps {
  city: string;
}

export default function SearchDesertHeatmap({ city }: SearchDesertHeatmapProps) {
  // Mock data for different neighborhoods with demand vs supply metrics
  const heatmapData = {
    Harare: [
      { neighborhood: "Mbare", demand: 450, supply: 120, gap: 330, position: { x: 30, y: 40 } },
      { neighborhood: "Avondale", demand: 280, supply: 240, gap: 40, position: { x: 50, y: 25 } },
      { neighborhood: "Borrowdale", demand: 320, supply: 290, gap: 30, position: { x: 70, y: 20 } },
      { neighborhood: "Highfield", demand: 520, supply: 180, gap: 340, position: { x: 40, y: 60 } },
      { neighborhood: "CBD", demand: 680, supply: 420, gap: 260, position: { x: 55, y: 45 } },
      { neighborhood: "Glen View", demand: 410, supply: 150, gap: 260, position: { x: 25, y: 70 } },
    ],
    Bulawayo: [
      { neighborhood: "Nkulumane", demand: 380, supply: 140, gap: 240, position: { x: 35, y: 55 } },
      { neighborhood: "Suburbs", demand: 290, supply: 250, gap: 40, position: { x: 60, y: 30 } },
      { neighborhood: "Lobengula", demand: 420, supply: 160, gap: 260, position: { x: 45, y: 65 } },
    ],
    Chitungwiza: [
      { neighborhood: "St Mary's", demand: 340, supply: 130, gap: 210, position: { x: 40, y: 45 } },
      { neighborhood: "Zengeza", demand: 460, supply: 180, gap: 280, position: { x: 55, y: 60 } },
    ],
    Mutare: [
      { neighborhood: "Sakubva", demand: 310, supply: 120, gap: 190, position: { x: 45, y: 50 } },
      { neighborhood: "Greenside", demand: 250, supply: 220, gap: 30, position: { x: 60, y: 35 } },
    ],
    Kwekwe: [
      { neighborhood: "Mbizo", demand: 280, supply: 110, gap: 170, position: { x: 50, y: 55 } },
    ],
  };

  const data = heatmapData[city as keyof typeof heatmapData] || heatmapData.Harare;

  // Calculate heat intensity (0-1) based on gap
  const maxGap = Math.max(...data.map(d => d.gap));
  
  const getHeatColor = (gap: number) => {
    const intensity = gap / maxGap;
    if (intensity > 0.7) return "from-[#EF4444] to-[#DC2626]"; // High gap - red
    if (intensity > 0.4) return "from-[#F59E0B] to-[#D97706]"; // Medium gap - orange
    return "from-[#10B981] to-[#059669]"; // Low gap - green
  };

  const getHeatSize = (gap: number) => {
    const intensity = gap / maxGap;
    return 40 + intensity * 60; // Size between 40-100px
  };

  const getAlertLevel = (gap: number) => {
    const intensity = gap / maxGap;
    if (intensity > 0.7) return "Critical";
    if (intensity > 0.4) return "Warning";
    return "Good";
  };

  return (
    <div>
      {/* Map Visualization */}
      <div className="relative w-full h-96 bg-gradient-to-br from-[#F8FAFC] to-[#E2E8F0] rounded-[24px] mb-6 overflow-hidden">
        {/* Grid overlay for map effect */}
        <div className="absolute inset-0 opacity-10">
          <div className="w-full h-full" style={{
            backgroundImage: `
              linear-gradient(0deg, transparent 24%, rgba(0, 0, 0, .05) 25%, rgba(0, 0, 0, .05) 26%, transparent 27%, transparent 74%, rgba(0, 0, 0, .05) 75%, rgba(0, 0, 0, .05) 76%, transparent 77%, transparent),
              linear-gradient(90deg, transparent 24%, rgba(0, 0, 0, .05) 25%, rgba(0, 0, 0, .05) 26%, transparent 27%, transparent 74%, rgba(0, 0, 0, .05) 75%, rgba(0, 0, 0, .05) 76%, transparent 77%, transparent)
            `,
            backgroundSize: '30px 30px'
          }} />
        </div>

        {/* Heat Points */}
        {data.map((point, idx) => {
          const size = getHeatSize(point.gap);
          return (
            <motion.div
              key={point.neighborhood}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.1, duration: 0.5 }}
              className="absolute"
              style={{
                left: `${point.position.x}%`,
                top: `${point.position.y}%`,
                transform: 'translate(-50%, -50%)',
              }}
            >
              {/* Pulsing heat circle */}
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.6, 0.3, 0.6],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: idx * 0.2,
                }}
                className={`absolute bg-gradient-to-br ${getHeatColor(point.gap)} rounded-full blur-xl`}
                style={{
                  width: `${size}px`,
                  height: `${size}px`,
                  left: '50%',
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                }}
              />
              
              {/* Data point card */}
              <div className="relative bg-white rounded-[20px] p-3 shadow-lg min-w-[140px] border border-[#E2E8F0] hover:scale-110 transition-transform cursor-pointer">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-bold text-sm text-[#0F172A]">{point.neighborhood}</h4>
                  {point.gap > maxGap * 0.7 && (
                    <AlertTriangle className="w-4 h-4 text-[#EF4444]" />
                  )}
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#64748B]">Demand:</span>
                    <span className="font-medium text-[#EF4444]">{point.demand}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#64748B]">Supply:</span>
                    <span className="font-medium text-[#10B981]">{point.supply}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-[#E2E8F0]">
                    <span className="text-[#64748B]">Gap:</span>
                    <span className={`font-bold ${point.gap > maxGap * 0.7 ? 'text-[#EF4444]' : point.gap > maxGap * 0.4 ? 'text-[#F59E0B]' : 'text-[#10B981]'}`}>
                      {point.gap}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Legend & Summary */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Legend */}
        <div className="bg-[#F8FAFC] rounded-[24px] p-6">
          <h3 className="font-bold text-[#0F172A] mb-4">Heat Legend</h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-4 h-4 bg-gradient-to-br from-[#EF4444] to-[#DC2626] rounded-full" />
              <span className="text-sm text-[#64748B]">Critical Gap (&gt;70%)</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-4 h-4 bg-gradient-to-br from-[#F59E0B] to-[#D97706] rounded-full" />
              <span className="text-sm text-[#64748B]">Medium Gap (40-70%)</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-4 h-4 bg-gradient-to-br from-[#10B981] to-[#059669] rounded-full" />
              <span className="text-sm text-[#64748B]">Low Gap (&lt;40%)</span>
            </div>
          </div>
        </div>

        {/* Top Priority Areas */}
        <div className="bg-[#F8FAFC] rounded-[24px] p-6">
          <h3 className="font-bold text-[#0F172A] mb-4 flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-[#EF4444]" />
            <span>Priority Zones</span>
          </h3>
          <div className="space-y-2">
            {data
              .sort((a, b) => b.gap - a.gap)
              .slice(0, 3)
              .map((area, idx) => (
                <div
                  key={area.neighborhood}
                  className="flex items-center justify-between p-3 bg-white rounded-[16px]"
                >
                  <div className="flex items-center space-x-3">
                    <span className="w-6 h-6 bg-gradient-to-br from-[#1E40AF] to-[#065F46] text-white rounded-full flex items-center justify-center text-xs font-bold">
                      {idx + 1}
                    </span>
                    <span className="text-sm font-medium text-[#0F172A]">
                      {area.neighborhood}
                    </span>
                  </div>
                  <span className="px-3 py-1 bg-[#EF4444]/10 text-[#EF4444] rounded-[12px] text-xs font-bold">
                    {getAlertLevel(area.gap)}
                  </span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}