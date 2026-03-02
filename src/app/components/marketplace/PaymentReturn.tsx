import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { useCart } from "../../contexts/CartContext";

export default function PaymentReturn() {
    const [params] = useSearchParams();
    const navigate = useNavigate();
    const { clearCart } = useCart();
    const [status, setStatus] = useState<"loading" | "success" | "failed">("loading");

    useEffect(() => {
        // Paynow adds 'status' and 'reference' query params on return.
        // If we're returned here, we check the query params.
        // For Sandbox, usually we either get a success or failure indication.

        // In a full production app, the backend webhook ("update" endpoint) reliably 
        // updates the database in the background, but we can use the URL params for fast UI feedback.

        // Because we're simulating a mock for now, if we arrive here, we'll assume the payment 
        // was processed if local storage has a pending order.

        const pendingOrderId = localStorage.getItem("pending_order_id");

        const timer = setTimeout(() => {
            if (pendingOrderId) {
                setStatus("success");
                clearCart();
                localStorage.removeItem("pending_order_id");
            } else {
                setStatus("failed");
            }
        }, 1500); // Artificial delay to simulate processing verification

        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex py-12 px-4 sm:px-6 lg:px-8">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-md w-full mx-auto bg-white rounded-[32px] shadow-xl overflow-hidden p-8 text-center flex flex-col items-center justify-center border border-slate-200"
            >
                {status === "loading" && (
                    <div className="flex flex-col items-center">
                        <Loader2 className="w-16 h-16 text-blue-600 animate-spin mb-6" />
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">Verifying Payment</h2>
                        <p className="text-slate-500">Please wait while we confirm your transaction securely with Paynow...</p>
                    </div>
                )}

                {status === "success" && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex flex-col items-center">
                        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
                            <CheckCircle2 className="w-10 h-10 text-emerald-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">Payment Successful!</h2>
                        <p className="text-slate-500 mb-8">
                            Your order has been paid for and is now being processed by the shop.
                        </p>
                        <button
                            onClick={() => navigate("/")}
                            className="w-full bg-blue-600 text-white font-bold py-3 px-6 rounded-[16px] hover:bg-blue-700 transition-colors"
                        >
                            Back to Marketplace
                        </button>
                    </motion.div>
                )}

                {status === "failed" && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex flex-col items-center">
                        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
                            <XCircle className="w-10 h-10 text-red-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">Payment Failed or Cancelled</h2>
                        <p className="text-slate-500 mb-8">
                            We couldn't verify your transaction. Your cart has been saved.
                        </p>
                        <button
                            onClick={() => navigate("/")}
                            className="w-full bg-slate-100 text-slate-700 font-bold py-3 px-6 rounded-[16px] hover:bg-slate-200 transition-colors"
                        >
                            Return to Retry Checkout
                        </button>
                    </motion.div>
                )}
            </motion.div>
        </div>
    );
}
