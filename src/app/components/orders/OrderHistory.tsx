import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Package, ArrowLeft, Clock, CheckCircle, XCircle, ShoppingBag, Truck, Home, MapPin, CreditCard, Star } from "lucide-react";
import { useNavigate } from "react-router";
import { useLocation } from "../Root";
import { api } from "../../../services/api";
import { toast } from "sonner";

const statusConfig: Record<string, { icon: any; color: string; bg: string; label: string }> = {
    completed: { icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50", label: "Completed" },
    paid: { icon: CheckCircle, color: "text-blue-600", bg: "bg-blue-50", label: "Paid" },
    pending: { icon: Clock, color: "text-amber-600", bg: "bg-amber-50", label: "Pending" },
    processing: { icon: Clock, color: "text-indigo-600", bg: "bg-indigo-50", label: "Processing" },
    "ready for pickup": { icon: Home, color: "text-teal-600", bg: "bg-teal-50", label: "Ready for Pickup" },
    "out for delivery": { icon: Truck, color: "text-purple-600", bg: "bg-purple-50", label: "Out for Delivery" },
    cancelled: { icon: XCircle, color: "text-red-600", bg: "bg-red-50", label: "Cancelled" },
};

const deliveryStatusSteps = ["Pending", "Ready for Pickup", "Out for Delivery", "Delivered"];
const pickupStatusSteps = ["Pending", "Ready for Pickup", "Picked Up"];

export default function OrderHistory() {
    const navigate = useNavigate();
    const { isAuthenticated } = useLocation();
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedOrder, setExpandedOrder] = useState<number | null>(null);

    useEffect(() => {
        if (!isAuthenticated) {
            navigate("/auth");
            return;
        }
        loadOrders();
    }, [isAuthenticated]);

    const loadOrders = async () => {
        try {
            const data = await api.getMyOrders();
            setOrders(data);
        } catch (error) {
            toast.error("Failed to load orders");
        } finally {
            setLoading(false);
        }
    };

    const getProgressSteps = (order: any) => {
        const isDelivery = order.delivery_type === "delivery";
        const steps = isDelivery ? deliveryStatusSteps : pickupStatusSteps;
        const currentIndex = steps.findIndex(
            (s) => s.toLowerCase() === (order.delivery_status || "Pending").toLowerCase()
        );
        return { steps, currentIndex: Math.max(currentIndex, 0) };
    };

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            {/* Header */}
            <div className="bg-gradient-to-br from-[#1E40AF] to-[#065F46] px-4 py-12">
                <div className="max-w-3xl mx-auto">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center text-white/80 hover:text-white mb-6 text-sm transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4 mr-1" /> Back
                    </button>
                    <div className="flex items-center space-x-3">
                        <Package className="w-8 h-8 text-white" />
                        <div>
                            <h1 className="text-2xl font-bold text-white">My Orders</h1>
                            <p className="text-white/70 text-sm">{orders.length} order{orders.length !== 1 ? "s" : ""} placed</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-3xl mx-auto px-4 -mt-6">
                {loading ? (
                    <div className="text-center py-20">
                        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto" />
                    </div>
                ) : orders.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-2xl shadow-lg border border-slate-100 p-12 text-center"
                    >
                        <ShoppingBag className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-slate-900 mb-1">No orders yet</h3>
                        <p className="text-sm text-slate-500 mb-6">Start shopping to see your orders here</p>
                        <button
                            onClick={() => navigate("/marketplace")}
                            className="px-6 py-2.5 bg-gradient-to-r from-[#1E40AF] to-[#065F46] text-white rounded-xl hover:shadow-lg transition-all font-medium text-sm"
                        >
                            Browse Marketplace
                        </button>
                    </motion.div>
                ) : (
                    <div className="space-y-4">
                        {orders.map((order: any, i: number) => {
                            const status = statusConfig[order.status] || statusConfig.pending;
                            const StatusIcon = status.icon;
                            const date = new Date(order.created_at).toLocaleDateString("en-US", {
                                month: "short", day: "numeric", year: "numeric"
                            });
                            const time = new Date(order.created_at).toLocaleTimeString("en-US", {
                                hour: "2-digit", minute: "2-digit"
                            });
                            const isExpanded = expandedOrder === order.id;
                            const { steps, currentIndex } = getProgressSteps(order);
                            const isDelivery = order.delivery_type === "delivery";

                            return (
                                <motion.div
                                    key={order.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                                    onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                                >
                                    {/* Order Header */}
                                    <div className="px-6 py-4 flex items-center justify-between border-b border-slate-50">
                                        <div className="flex items-center space-x-3">
                                            <span className="text-sm font-bold text-slate-900">Order #{order.id}</span>
                                            <span className="text-xs text-slate-400">{date} · {time}</span>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            {/* Delivery Type Badge */}
                                            <div className={`flex items-center space-x-1 px-2.5 py-1 rounded-full ${isDelivery ? "bg-purple-50" : "bg-teal-50"}`}>
                                                {isDelivery ? (
                                                    <Truck className="w-3 h-3 text-purple-600" />
                                                ) : (
                                                    <Home className="w-3 h-3 text-teal-600" />
                                                )}
                                                <span className={`text-xs font-semibold ${isDelivery ? "text-purple-600" : "text-teal-600"}`}>
                                                    {isDelivery ? "Delivery" : "Pickup"}
                                                </span>
                                            </div>
                                            {/* Order Status Badge */}
                                            <div className={`flex items-center space-x-1.5 px-3 py-1 rounded-full ${status.bg}`}>
                                                <StatusIcon className={`w-3.5 h-3.5 ${status.color}`} />
                                                <span className={`text-xs font-semibold ${status.color}`}>{status.label}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Delivery Progress Tracker */}
                                    {isExpanded && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            className="px-6 py-4 bg-slate-50 border-b border-slate-100"
                                        >
                                            <p className="text-xs font-semibold text-slate-500 mb-3 uppercase tracking-wide">Delivery Progress</p>
                                            <div className="flex items-center justify-between">
                                                {steps.map((step, idx) => (
                                                    <div key={step} className="flex flex-col items-center flex-1">
                                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${idx <= currentIndex
                                                                ? "bg-gradient-to-r from-[#1E40AF] to-[#065F46] text-white"
                                                                : "bg-slate-200 text-slate-400"
                                                            }`}>
                                                            {idx <= currentIndex ? "✓" : idx + 1}
                                                        </div>
                                                        <span className={`text-[10px] mt-1 text-center leading-tight ${idx <= currentIndex ? "text-slate-700 font-semibold" : "text-slate-400"
                                                            }`}>
                                                            {step}
                                                        </span>
                                                        {idx < steps.length - 1 && (
                                                            <div className={`hidden`} />
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                            {/* Connector lines */}
                                            <div className="flex items-center mt-[-30px] mb-4 px-3">
                                                {steps.slice(0, -1).map((_, idx) => (
                                                    <div key={idx} className={`flex-1 h-0.5 mx-1 ${idx < currentIndex ? "bg-[#1E40AF]" : "bg-slate-200"
                                                        }`} />
                                                ))}
                                            </div>

                                            {/* Delivery Address */}
                                            {isDelivery && order.delivery_address && (
                                                <div className="flex items-start space-x-2 mt-2 bg-white rounded-xl p-3">
                                                    <MapPin className="w-4 h-4 text-[#1E40AF] mt-0.5 shrink-0" />
                                                    <p className="text-xs text-slate-600">{order.delivery_address}</p>
                                                </div>
                                            )}
                                        </motion.div>
                                    )}

                                    {/* Items */}
                                    <div className="px-6 py-3 space-y-2">
                                        {order.items?.map((item: any) => (
                                            <div key={item.id} className="flex items-center justify-between py-1">
                                                <div className="flex items-center space-x-3">
                                                    {item.product?.image_url ? (
                                                        <img src={item.product.image_url} alt="" className="w-10 h-10 rounded-lg object-cover bg-slate-100" />
                                                    ) : (
                                                        <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                                                            <Package className="w-5 h-5 text-slate-400" />
                                                        </div>
                                                    )}
                                                    <div>
                                                        <p className="text-sm font-medium text-slate-900">{item.product?.name || "Product"}</p>
                                                        <p className="text-xs text-slate-400">Qty: {item.quantity}</p>
                                                    </div>
                                                </div>
                                                <span className="text-sm font-semibold text-slate-900">${(item.price || 0).toFixed(2)}</span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Footer */}
                                    <div className="px-6 py-3 bg-slate-50 flex flex-wrap items-center justify-between gap-2">
                                        <div className="flex items-center space-x-3">
                                            <span className="text-xs text-slate-400">{order.shop?.name || "Shop"}</span>
                                            {order.delivery_fee > 0 && (
                                                <span className="text-[10px] bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full font-medium">
                                                    +${order.delivery_fee.toFixed(2)} delivery
                                                </span>
                                            )}
                                            {order.credits_used > 0 && (
                                                <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium flex items-center space-x-1">
                                                    <Star className="w-2.5 h-2.5" />
                                                    <span>{order.credits_used} credits used</span>
                                                </span>
                                            )}
                                        </div>
                                        <span className="text-sm font-bold text-slate-900">Total: ${(order.total_amount || 0).toFixed(2)}</span>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
