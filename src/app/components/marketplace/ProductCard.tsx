import { MapPin, Star, ShoppingCart, Phone, MessageCircle, Share2 } from "lucide-react";
import { motion } from "motion/react";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import { useCart } from "../../contexts/CartContext";
import { useState } from "react";
import { toast } from "sonner";
import ShopInteractionModal from "./ShopInteractionModal";

interface Product {
  id: string;
  name: string;
  price: number;
  shop: string;
  shopId: number;
  distance: string;
  rating: number;
  imageUrl: string;
  inStock: boolean;
  shopPhone?: string;
  shopLocation?: string;
}

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();
  const [isAdding, setIsAdding] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<'chat' | 'reviews'>('chat');

  const openModal = (tab: 'chat' | 'reviews') => {
    setModalTab(tab);
    setModalOpen(true);
  };

  const handleAddToCart = () => {
    if (!product.inStock) return;

    setIsAdding(true);
    addToCart({
      id: `cart-${product.id}-${Date.now()}`,
      productId: product.id,
      name: product.name,
      price: product.price,
      imageUrl: product.imageUrl,
      shop: product.shop,
      shopPhone: product.shopPhone,
      shopLocation: product.shopLocation,
      distance: product.distance,
    });

    toast.success(`${product.name} added to cart!`, {
      description: `From ${product.shop}`,
    });

    setTimeout(() => {
      setIsAdding(false);
    }, 500);
  };

  const handleShare = async () => {
    const shareData = {
      title: `${product.name} at ${product.shop}`,
      text: `Check out this ${product.name} for $${product.price} at ${product.shop} on LocalConnect!`,
      url: window.location.href, // Or a specific product route if you have one
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        // Silently ignore share aborts
      }
    } else {
      // Fallback: Copy to clipboard
      try {
        await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
        toast.success("Link copied to clipboard!");
      } catch (err) {
        console.error("Failed to copy", err);
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className="bg-white rounded-[32px] overflow-hidden shadow-lg hover:shadow-xl transition-all border border-slate-200"
    >
      {/* Image */}
      <div className="relative h-40 overflow-hidden">
        <ImageWithFallback
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-4 right-4 px-3 py-2 bg-white/90 backdrop-blur-sm rounded-[16px] flex items-center space-x-1">
          <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
          <span className="text-sm font-medium text-slate-900">{product.rating}</span>
        </div>
        {!product.inStock && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
            <span className="px-4 py-2 bg-white rounded-[16px] text-sm font-bold text-red-500">
              Out of Stock
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="text-base font-bold text-slate-900 mb-1 line-clamp-2">
          {product.name}
        </h3>

        <div className="flex items-center justify-between mb-4">
          <div className="text-2xl font-bold text-blue-600">
            ${product.price.toFixed(2)}
          </div>
          <div className="flex items-center space-x-1 px-3 py-1.5 bg-slate-100 rounded-[12px]">
            <MapPin className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-sm font-medium text-emerald-600">{product.distance}</span>
          </div>
        </div>

        {/* Shop Name */}
        <div className="space-y-2 mb-4">
          <p className="text-sm font-medium text-slate-900">{product.shop}</p>
          {product.shopPhone && (
            <div className="flex items-center space-x-2 text-sm text-slate-500">
              <Phone className="w-3.5 h-3.5" />
              <span>{product.shopPhone}</span>
            </div>
          )}
          {product.shopLocation && (
            <div className="flex items-center space-x-2 text-sm text-slate-500">
              <MapPin className="w-3.5 h-3.5" />
              <span>{product.shopLocation}</span>
            </div>
          )}
        </div>

        {/* Interaction Actions */}
        <div className="flex items-center justify-between mb-3 border-t border-slate-200 pt-3">
          <button
            onClick={() => openModal('chat')}
            className="flex flex-1 justify-center items-center space-x-2 text-sm font-medium text-blue-600 bg-[#F0F9FF] px-2 py-2 rounded-[12px] hover:bg-[#DBEAFE] transition-colors mr-2"
          >
            <MessageCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Chat</span>
          </button>
          <button
            onClick={() => openModal('reviews')}
            className="flex flex-1 justify-center items-center space-x-2 text-sm font-medium text-amber-500 bg-[#FEF3C7] px-2 py-2 rounded-[12px] hover:bg-[#FDE68A] transition-colors mr-2"
          >
            <Star className="w-4 h-4" />
            <span className="hidden sm:inline">Reviews</span>
          </button>
          <button
            onClick={handleShare}
            className="flex flex-1 justify-center items-center space-x-2 text-sm font-medium text-[#059669] bg-[#D1FAE5] px-2 py-2 rounded-[12px] hover:bg-[#A7F3D0] transition-colors"
          >
            <Share2 className="w-4 h-4" />
            <span className="hidden sm:inline">Share</span>
          </button>
        </div>

        {/* Add to Cart Button */}
        <button
          onClick={handleAddToCart}
          disabled={!product.inStock}
          className={`w-full flex items-center justify-center space-x-2 py-2.5 bg-gradient-to-br from-blue-600 to-emerald-600 text-white rounded-[16px] text-sm hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${isAdding ? "scale-95" : ""
            }`}
        >
          <ShoppingCart className="w-4 h-4" />
          <span className="font-medium">
            {isAdding ? "Added!" : product.inStock ? "Add to Cart" : "Unavailable"}
          </span>
        </button>
      </div>

      {modalOpen && (
        <ShopInteractionModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          shopName={product.shop}
          shopId={product.shopId}
          initialTab={modalTab}
        />
      )}
    </motion.div>
  );
}