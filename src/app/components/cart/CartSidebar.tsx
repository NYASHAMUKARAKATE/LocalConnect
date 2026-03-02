import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ShoppingCart,
  X,
  Plus,
  Minus,
  Trash2,
  MapPin,
  Phone,
  Store,
  CreditCard,
  Navigation,
  Truck,
  Home,
} from "lucide-react";
import { useCart } from "../../contexts/CartContext";
import { api } from "../../../services/api";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import { toast } from "sonner";
import { useLocation } from "../Root";

export default function CartSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<"cart" | "payment">("cart");
  const [selectedPayment, setSelectedPayment] = useState("EcoCash");
  const [deliveryType, setDeliveryType] = useState<"pickup" | "delivery">("pickup");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [useCredits, setUseCredits] = useState(false);
  const DELIVERY_FEE = 2.50; // flat fee for delivery orders

  const paymentMethods = ["EcoCash", "InnBucks", "Omari", "Paynow", "OneMoney"];
  const { cartItems, updateQuantity, removeFromCart, getCartTotal, clearCart } = useCart();
  const { credits } = useLocation();

  // Group items by shop
  const itemsByShop = cartItems.reduce((acc, item) => {
    if (!acc[item.shop]) {
      acc[item.shop] = {
        shopName: item.shop,
        shopPhone: item.shopPhone,
        shopLocation: item.shopLocation,
        distance: item.distance,
        items: [],
      };
    }
    acc[item.shop].items.push(item);
    return acc;
  }, {} as Record<string, any>);

  const shopGroups = Object.values(itemsByShop);

  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const handleCheckout = async () => {
    if (deliveryType === "delivery" && !deliveryAddress.trim()) {
      toast.error("Please provide a delivery address");
      return;
    }

    setIsCheckingOut(true);
    try {
      toast.loading("Creating order...");

      const orderPayload = {
        delivery_type: deliveryType,
        delivery_address: deliveryType === "delivery" ? deliveryAddress : undefined,
        credits_to_use: useCredits ? Math.min(credits, Math.floor(getCartTotal() * 100)) : 0
      };

      const orderArray = await api.createOrder(orderPayload);
      const firstOrder = orderArray[0]; // Process payment for the first returned order portion

      toast.dismiss();

      if (selectedPayment === "Paynow" || selectedPayment === "EcoCash" || selectedPayment === "OneMoney") {
        toast.loading(`Redirecting securely to ${selectedPayment}...`);

        // In a real scenario we'd query the user's authentic email profile. We use a placeholder here for the Sandbox payment receipt.
        const res = await api.initiatePaynowPayment(firstOrder.id, "customer@localconnect.co.zw");

        // Stash order id in local storage so Return page knows what to verify
        localStorage.setItem("pending_order_id", firstOrder.id.toString());

        // Forward the user to the Paynow platform
        window.location.href = res.redirect_url;
        return;
      } else {
        toast.success(`Mock payment successful via ${selectedPayment}!`);
        clearCart();
        setIsOpen(false);
        setCheckoutStep("cart");
      }
    } catch (error: any) {
      toast.dismiss();
      console.error("Checkout failed", error);
      toast.error(error.message || "Failed to place order and process payment");
    } finally {
      setIsCheckingOut(false);
    }
  };

  const handleNavigateToStore = (shopName: string, shopLocation?: string, lat?: number, lng?: number) => {
    if (!shopLocation && (!lat || !lng)) {
      toast.error("Location not available for this store");
      return;
    }

    let googleMapsUrl = "";
    if (lat && lng) {
      // Use exact coordinates for routing
      googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    } else if (shopLocation) {
      // Fallback to searching the string
      const encodedLocation = encodeURIComponent(shopLocation);
      googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedLocation}`;
    }

    // Open in new tab/window
    window.open(googleMapsUrl, '_blank');

    toast.success(`Opening directions to ${shopName}`);
  };

  const handleCallStore = (shopName: string, phoneNumber?: string) => {
    if (!phoneNumber) {
      toast.error("Phone number not available for this store");
      return;
    }

    // Remove any spaces or formatting from phone number
    const cleanPhone = phoneNumber.replace(/\s/g, '');
    window.location.href = `tel:${cleanPhone}`;
  };

  return (
    <>
      {/* Cart Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="relative p-2 hover:bg-[#F1F5F9] rounded-[12px] transition-colors"
      >
        <ShoppingCart className="w-5 h-5 text-[#0F172A]" />
        {cartItems.length > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-[#EF4444] to-[#DC2626] text-white text-xs font-bold rounded-full flex items-center justify-center">
            {cartItems.reduce((sum, item) => sum + item.quantity, 0)}
          </span>
        )}
      </button>

      {/* Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            />

            {/* Sidebar Panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-[#E2E8F0]">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#1E40AF] to-[#065F46] rounded-[16px] flex items-center justify-center">
                    <ShoppingCart className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-[#0F172A]">Shopping Cart</h2>
                    <p className="text-sm text-[#64748B]">
                      {cartItems.length} {cartItems.length === 1 ? "item" : "items"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    setCheckoutStep("cart");
                  }}
                  className="p-2 hover:bg-[#F1F5F9] rounded-[12px] transition-colors"
                >
                  <X className="w-6 h-6 text-[#64748B]" />
                </button>
              </div>

              {/* Cart Items */}
              <div className="flex-1 overflow-y-auto p-6">
                {checkoutStep === "payment" ? (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-6 flex flex-col items-center justify-center h-full"
                  >
                    <div className="w-16 h-16 bg-[#F0F9FF] rounded-full flex items-center justify-center mb-2 mt-4">
                      <CreditCard className="w-8 h-8 text-[#1E40AF]" />
                    </div>
                    <h3 className="text-xl font-bold text-[#0F172A]">How would you like to get your order?</h3>

                    {/* Pickup vs Delivery Toggle */}
                    <div className="w-full grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setDeliveryType("pickup")}
                        className={`flex flex-col items-center justify-center p-4 rounded-[16px] border-2 transition-all ${deliveryType === "pickup"
                          ? "border-[#1E40AF] bg-[#F0F9FF] shadow-md"
                          : "border-[#E2E8F0] hover:border-[#CBD5E1] bg-white"
                          }`}
                      >
                        <Home className={`w-6 h-6 mb-2 ${deliveryType === "pickup" ? "text-[#1E40AF]" : "text-[#94A3B8]"}`} />
                        <span className={`font-bold text-sm ${deliveryType === "pickup" ? "text-[#1E40AF]" : "text-[#64748B]"}`}>Pickup</span>
                        <span className="text-xs text-[#94A3B8] mt-1">Collect from store</span>
                        <span className="text-xs font-bold text-[#10B981] mt-1">Free</span>
                      </button>
                      <button
                        onClick={() => setDeliveryType("delivery")}
                        className={`flex flex-col items-center justify-center p-4 rounded-[16px] border-2 transition-all ${deliveryType === "delivery"
                          ? "border-[#1E40AF] bg-[#F0F9FF] shadow-md"
                          : "border-[#E2E8F0] hover:border-[#CBD5E1] bg-white"
                          }`}
                      >
                        <Truck className={`w-6 h-6 mb-2 ${deliveryType === "delivery" ? "text-[#1E40AF]" : "text-[#94A3B8]"}`} />
                        <span className={`font-bold text-sm ${deliveryType === "delivery" ? "text-[#1E40AF]" : "text-[#64748B]"}`}>Delivery</span>
                        <span className="text-xs text-[#94A3B8] mt-1">To your door</span>
                        <span className="text-xs font-bold text-[#F59E0B] mt-1">+${DELIVERY_FEE.toFixed(2)}</span>
                      </button>
                    </div>

                    {/* Delivery Address - Only when delivery selected */}
                    {deliveryType === "delivery" && (
                      <div className="w-full">
                        <label className="block text-sm font-bold text-[#0F172A] mb-2">Delivery Address</label>
                        <textarea
                          value={deliveryAddress}
                          onChange={(e) => setDeliveryAddress(e.target.value)}
                          placeholder="123 Street Name, Suburb, City"
                          className="w-full px-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[16px] focus:outline-none focus:ring-2 focus:ring-[#1E40AF] focus:bg-white transition-all resize-none h-20"
                        />
                      </div>
                    )}

                    {/* Loyalty Credits */}
                    {credits > 0 && (
                      <div className="w-full bg-[#F0F9FF] border border-[#BFDBFE] rounded-[16px] p-4 flex items-center justify-between">
                        <div>
                          <p className="font-bold text-[#1E40AF]">Community Credits</p>
                          <p className="text-sm text-[#3B82F6]">You have {credits} credits</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={useCredits}
                            onChange={(e) => setUseCredits(e.target.checked)}
                          />
                          <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1E40AF]"></div>
                        </label>
                      </div>
                    )}

                    <div className="w-full space-y-3 pb-8">
                      <label className="block text-sm font-bold text-[#0F172A] mt-4 mb-2">Payment Option</label>
                      {paymentMethods.map(method => (
                        <button
                          key={method}
                          onClick={() => setSelectedPayment(method)}
                          className={`w-full flex items-center justify-between p-4 rounded-[16px] border-2 transition-all ${selectedPayment === method
                            ? "border-[#1E40AF] bg-[#F0F9FF]"
                            : "border-[#E2E8F0] hover:border-[#CBD5E1] bg-white"
                            }`}
                        >
                          <span className="font-bold text-[#0F172A]">{method}</span>
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedPayment === method ? "border-[#1E40AF]" : "border-[#CBD5E1]"
                            }`}>
                            {selectedPayment === method && <div className="w-2.5 h-2.5 bg-[#1E40AF] rounded-full" />}
                          </div>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                ) : cartItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <div className="w-24 h-24 bg-[#F1F5F9] rounded-full flex items-center justify-center mb-4">
                      <ShoppingCart className="w-12 h-12 text-[#94A3B8]" />
                    </div>
                    <h3 className="text-lg font-bold text-[#0F172A] mb-2">
                      Your cart is empty
                    </h3>
                    <p className="text-sm text-[#64748B]">
                      Add items from the marketplace to get started
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {shopGroups.map((shopGroup, idx) => (
                      <motion.div
                        key={shopGroup.shopName}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="space-y-4"
                      >
                        {/* Shop Header */}
                        <div className="bg-gradient-to-br from-[#F0F9FF] to-[#DBEAFE] rounded-[20px] p-4 border border-[#BFDBFE]">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center space-x-2">
                              <Store className="w-5 h-5 text-[#1E40AF]" />
                              <h3 className="font-bold text-[#0F172A]">
                                {shopGroup.shopName}
                              </h3>
                            </div>
                            <span className="text-xs font-medium text-[#065F46] bg-[#D1FAE5] px-3 py-1 rounded-[12px]">
                              {shopGroup.distance}
                            </span>
                          </div>

                          {/* Store Contact Info */}
                          <div className="space-y-2 mb-3">
                            {shopGroup.shopLocation && (
                              <div className="flex items-center space-x-2 text-xs text-[#64748B]">
                                <MapPin className="w-3.5 h-3.5" />
                                <span className="flex-1">{shopGroup.shopLocation}</span>
                              </div>
                            )}
                            {shopGroup.shopPhone && (
                              <div className="flex items-center space-x-2 text-xs text-[#64748B]">
                                <Phone className="w-3.5 h-3.5" />
                                <span>{shopGroup.shopPhone}</span>
                              </div>
                            )}
                          </div>

                          {/* Action Buttons */}
                          <div className="flex space-x-2">
                            {shopGroup.shopLocation && (
                              <button
                                onClick={() => handleNavigateToStore(shopGroup.shopName, shopGroup.shopLocation)}
                                className="flex-1 flex items-center justify-center space-x-2 py-2.5 bg-gradient-to-br from-[#1E40AF] to-[#1e3a8a] text-white rounded-[16px] hover:shadow-lg transition-all text-sm font-medium"
                              >
                                <Navigation className="w-4 h-4" />
                                <span>Navigate</span>
                              </button>
                            )}
                            {shopGroup.shopPhone && (
                              <button
                                onClick={() => handleCallStore(shopGroup.shopName, shopGroup.shopPhone)}
                                className="flex-1 flex items-center justify-center space-x-2 py-2.5 bg-white border-2 border-[#1E40AF] text-[#1E40AF] rounded-[16px] hover:bg-[#F0F9FF] transition-all text-sm font-medium"
                              >
                                <Phone className="w-4 h-4" />
                                <span>Call</span>
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Items from this shop */}
                        <div className="space-y-3">
                          {shopGroup.items.map((item: any) => (
                            <div
                              key={item.productId}
                              className="bg-white border border-[#E2E8F0] rounded-[20px] p-4 hover:shadow-md transition-shadow"
                            >
                              <div className="flex space-x-4">
                                <div className="w-20 h-20 rounded-[16px] overflow-hidden bg-[#F1F5F9] flex-shrink-0">
                                  <ImageWithFallback
                                    src={item.imageUrl}
                                    alt={item.name}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-bold text-[#0F172A] mb-1 line-clamp-1">
                                    {item.name}
                                  </h4>
                                  <p className="text-lg font-bold text-[#1E40AF] mb-3">
                                    ${item.price.toFixed(2)}
                                  </p>

                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                      <button
                                        onClick={() =>
                                          updateQuantity(item.productId, item.quantity - 1)
                                        }
                                        className="w-8 h-8 flex items-center justify-center bg-[#F1F5F9] hover:bg-[#E2E8F0] rounded-[10px] transition-colors"
                                      >
                                        <Minus className="w-4 h-4 text-[#64748B]" />
                                      </button>
                                      <span className="w-8 text-center font-bold text-[#0F172A]">
                                        {item.quantity}
                                      </span>
                                      <button
                                        onClick={() =>
                                          updateQuantity(item.productId, item.quantity + 1)
                                        }
                                        className="w-8 h-8 flex items-center justify-center bg-[#F1F5F9] hover:bg-[#E2E8F0] rounded-[10px] transition-colors"
                                      >
                                        <Plus className="w-4 h-4 text-[#64748B]" />
                                      </button>
                                    </div>
                                    <button
                                      onClick={() => removeFromCart(item.productId)}
                                      className="p-2 hover:bg-[#FEF2F2] rounded-[10px] transition-colors"
                                    >
                                      <Trash2 className="w-4 h-4 text-[#EF4444]" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              {cartItems.length > 0 && (
                <div className="border-t border-[#E2E8F0] p-6 space-y-4 bg-white">
                  {/* Subtotal & Discounts */}
                  <div className="bg-[#F8FAFC] p-4 rounded-[16px] space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[#64748B]">Subtotal</span>
                      <span className="font-medium text-[#0F172A]">${getCartTotal().toFixed(2)}</span>
                    </div>
                    {deliveryType === "delivery" && (
                      <div className="flex items-center justify-between text-sm text-[#F59E0B]">
                        <span>Delivery Fee</span>
                        <span>+${DELIVERY_FEE.toFixed(2)}</span>
                      </div>
                    )}
                    {useCredits && credits > 0 && (
                      <div className="flex items-center justify-between text-sm text-[#10B981]">
                        <span>Credits Applied</span>
                        <span>-${(Math.min(credits, Math.floor(getCartTotal() * 100)) / 100).toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between border-t border-[#E2E8F0] pt-2 mt-2">
                      <span className="text-lg font-bold text-[#0F172A]">Total</span>
                      <span className="text-2xl font-bold text-[#1E40AF]">
                        ${Math.max(0, getCartTotal() + (deliveryType === "delivery" ? DELIVERY_FEE : 0) - (useCredits ? Math.min(credits, Math.floor(getCartTotal() * 100)) / 100 : 0)).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  {checkoutStep === "cart" ? (
                    <div className="space-y-3">
                      <button
                        onClick={() => setCheckoutStep("payment")}
                        className="w-full flex items-center justify-center space-x-2 py-4 bg-gradient-to-br from-[#1E40AF] to-[#065F46] text-white rounded-[24px] hover:shadow-xl transition-all"
                      >
                        <>
                          <CreditCard className="w-5 h-5" />
                          <span className="font-bold">Proceed to Checkout</span>
                        </>
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm("Are you sure you want to clear your cart?")) {
                            clearCart();
                          }
                        }}
                        className="w-full py-3 border border-[#E2E8F0] text-[#64748B] rounded-[24px] hover:bg-[#F1F5F9] transition-colors font-medium"
                      >
                        Clear Cart
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3 mt-4">
                      <button
                        onClick={handleCheckout}
                        disabled={isCheckingOut}
                        className="w-full flex items-center justify-center space-x-2 py-4 bg-gradient-to-br from-[#1E40AF] to-[#065F46] text-white rounded-[24px] hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isCheckingOut ? (
                          <span className="font-bold">Processing payment...</span>
                        ) : (
                          <span className="font-bold">
                            Pay ${Math.max(0, getCartTotal() + (deliveryType === "delivery" ? DELIVERY_FEE : 0) - (useCredits ? Math.min(credits, Math.floor(getCartTotal() * 100)) / 100 : 0)).toFixed(2)}
                          </span>
                        )}
                      </button>
                      <button
                        onClick={() => setCheckoutStep("cart")}
                        disabled={isCheckingOut}
                        className="w-full py-3 border border-[#E2E8F0] text-[#64748B] rounded-[24px] hover:bg-[#F1F5F9] transition-colors font-medium"
                      >
                        Back to Cart
                      </button>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}