import { Users, Clock, MapPin, TrendingDown } from "lucide-react";
import { motion } from "motion/react";
import { ImageWithFallback } from "../figma/ImageWithFallback";

interface GroupBuyDeal {
  id: string;
  title: string;
  currentParticipants: number;
  targetParticipants: number;
  pricePerUnit: number;
  regularPrice: number;
  shop: string;
  distance: string;
  imageUrl: string;
  endsIn: string;
}

interface GroupBuyCardProps {
  deal: GroupBuyDeal;
}

export default function GroupBuyCard({ deal }: GroupBuyCardProps) {
  const progress = (deal.currentParticipants / deal.targetParticipants) * 100;
  const savings = deal.regularPrice - deal.pricePerUnit;
  const savingsPercent = Math.round((savings / deal.regularPrice) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className="bg-white rounded-[32px] overflow-hidden shadow-lg hover:shadow-xl transition-all border border-[#E2E8F0]"
    >
      {/* Image */}
      <div className="relative h-48 overflow-hidden">
        <ImageWithFallback
          src={deal.imageUrl}
          alt={deal.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-4 right-4 px-3 py-2 bg-[#EF4444] text-white rounded-[16px] text-sm font-bold flex items-center space-x-1">
          <TrendingDown className="w-4 h-4" />
          <span>{savingsPercent}% OFF</span>
        </div>
        <div className="absolute top-4 left-4 px-3 py-2 bg-black/50 backdrop-blur-sm text-white rounded-[16px] text-sm font-medium">
          Group Buy
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <h3 className="text-xl font-bold text-[#0F172A] mb-2">{deal.title}</h3>
        
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-bold text-[#065F46]">
                ${deal.pricePerUnit}
              </span>
              <span className="text-sm text-[#64748B] line-through">
                ${deal.regularPrice}
              </span>
            </div>
            <p className="text-xs text-[#64748B] mt-1">per unit</p>
          </div>
          
          <div className="text-right">
            <div className="flex items-center space-x-1 text-[#1E40AF] mb-1">
              <Clock className="w-4 h-4" />
              <span className="text-sm font-medium">{deal.endsIn}</span>
            </div>
            <p className="text-xs text-[#64748B]">remaining</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-[#1E40AF]" />
              <span className="text-sm font-medium text-[#0F172A]">
                {deal.currentParticipants} / {deal.targetParticipants} joined
              </span>
            </div>
            <span className="text-sm font-bold text-[#1E40AF]">
              {Math.round(progress)}%
            </span>
          </div>
          
          <div className="w-full h-3 bg-[#F1F5F9] rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1, delay: 0.2 }}
              className="h-full bg-gradient-to-r from-[#1E40AF] to-[#065F46] rounded-full"
            />
          </div>
        </div>

        {/* Shop Info */}
        <div className="flex items-center justify-between pt-4 border-t border-[#E2E8F0]">
          <div>
            <p className="text-sm font-medium text-[#0F172A]">{deal.shop}</p>
            <div className="flex items-center space-x-1 mt-1">
              <MapPin className="w-3 h-3 text-[#64748B]" />
              <span className="text-xs text-[#64748B]">{deal.distance}</span>
            </div>
          </div>
          
          <button className="px-6 py-3 bg-gradient-to-br from-[#1E40AF] to-[#065F46] text-white rounded-[20px] hover:opacity-90 transition-opacity font-medium">
            Join Now
          </button>
        </div>
      </div>
    </motion.div>
  );
}
