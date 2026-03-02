import { useState } from "react";
import { X, Camera, Upload, MapPin, Tag, DollarSign, Package, CheckCircle } from "lucide-react";
import { motion } from "motion/react";

interface SnapAndVerifyProps {
  onClose: () => void;
}

export default function SnapAndVerify({ onClose }: SnapAndVerifyProps) {
  const [step, setStep] = useState<"capture" | "details" | "success">("capture");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    productName: "",
    price: "",
    shop: "",
    category: "",
    inStock: true,
  });

  const categories = [
    "Fresh Produce",
    "Bakery",
    "Dairy",
    "Meat & Poultry",
    "Grains & Cereals",
    "Beverages",
    "Other",
  ];

  const handleImageCapture = () => {
    // Simulate image capture
    setCapturedImage("https://images.unsplash.com/photo-1509440159596-0249088772ff");
    setStep("details");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep("success");
    // Simulate submission
    setTimeout(() => {
      onClose();
    }, 3000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-[40px] max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-br from-[#1E40AF] to-[#065F46] p-6 rounded-t-[40px]">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white/20 rounded-[16px] flex items-center justify-center">
                <Camera className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Snap & Verify</h2>
                <p className="text-sm text-white/80">Document local products</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-[12px] transition-colors"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center space-x-4 mt-6">
            {["Capture", "Details", "Done"].map((label, idx) => (
              <div key={label} className="flex items-center flex-1">
                <div className="flex items-center space-x-2 flex-1">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      (step === "capture" && idx === 0) ||
                      (step === "details" && idx <= 1) ||
                      (step === "success" && idx <= 2)
                        ? "bg-white text-[#1E40AF]"
                        : "bg-white/20 text-white/60"
                    }`}
                  >
                    {idx + 1}
                  </div>
                  <span className="text-sm text-white font-medium hidden sm:inline">
                    {label}
                  </span>
                </div>
                {idx < 2 && (
                  <div
                    className={`h-0.5 w-full mx-2 ${
                      (step === "details" && idx === 0) || (step === "success" && idx <= 1)
                        ? "bg-white"
                        : "bg-white/20"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          {/* Step 1: Capture */}
          {step === "capture" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="text-center">
                <h3 className="text-2xl font-bold text-[#0F172A] mb-2">
                  Capture Product Photo
                </h3>
                <p className="text-[#64748B]">
                  Take a clear photo of the product and its price tag
                </p>
              </div>

              {/* Camera View Simulation */}
              <div className="relative aspect-[4/3] bg-gradient-to-br from-[#F8FAFC] to-[#E2E8F0] rounded-[32px] overflow-hidden flex items-center justify-center border-4 border-dashed border-[#E2E8F0]">
                {capturedImage ? (
                  <img
                    src={capturedImage}
                    alt="Captured"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center">
                    <Camera className="w-20 h-20 text-[#64748B] mx-auto mb-4" />
                    <p className="text-[#64748B] font-medium">Camera viewfinder</p>
                  </div>
                )}

                {/* Camera Guidelines */}
                {!capturedImage && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-3/4 h-3/4 border-2 border-white rounded-[24px] shadow-lg" />
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-4">
                <button
                  onClick={handleImageCapture}
                  className="flex-1 flex items-center justify-center space-x-3 py-4 bg-gradient-to-br from-[#1E40AF] to-[#065F46] text-white rounded-[24px] hover:opacity-90 transition-opacity font-bold"
                >
                  <Camera className="w-5 h-5" />
                  <span>Take Photo</span>
                </button>
                <button className="flex-1 flex items-center justify-center space-x-3 py-4 bg-[#F8FAFC] hover:bg-[#F1F5F9] text-[#0F172A] rounded-[24px] transition-colors font-medium border border-[#E2E8F0]">
                  <Upload className="w-5 h-5" />
                  <span>Upload</span>
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 2: Details */}
          {step === "details" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-[#0F172A] mb-2">
                  Add Product Details
                </h3>
                <p className="text-[#64748B]">
                  Fill in the information about the product
                </p>
              </div>

              {/* Preview Image */}
              {capturedImage && (
                <div className="mb-6">
                  <img
                    src={capturedImage}
                    alt="Preview"
                    className="w-full h-48 object-cover rounded-[24px]"
                  />
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Product Name */}
                <div>
                  <label className="flex items-center space-x-2 text-sm font-medium text-[#64748B] mb-2">
                    <Package className="w-4 h-4" />
                    <span>Product Name</span>
                  </label>
                  <input
                    type="text"
                    value={formData.productName}
                    onChange={(e) =>
                      setFormData({ ...formData, productName: e.target.value })
                    }
                    placeholder="e.g., Fresh Whole Wheat Bread"
                    className="w-full px-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[20px] focus:outline-none focus:border-[#1E40AF] transition-colors"
                    required
                  />
                </div>

                {/* Price */}
                <div>
                  <label className="flex items-center space-x-2 text-sm font-medium text-[#64748B] mb-2">
                    <DollarSign className="w-4 h-4" />
                    <span>Price</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                    placeholder="0.00"
                    className="w-full px-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[20px] focus:outline-none focus:border-[#1E40AF] transition-colors"
                    required
                  />
                </div>

                {/* Shop Name */}
                <div>
                  <label className="flex items-center space-x-2 text-sm font-medium text-[#64748B] mb-2">
                    <MapPin className="w-4 h-4" />
                    <span>Shop Name</span>
                  </label>
                  <input
                    type="text"
                    value={formData.shop}
                    onChange={(e) =>
                      setFormData({ ...formData, shop: e.target.value })
                    }
                    placeholder="e.g., Sunrise Bakery"
                    className="w-full px-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[20px] focus:outline-none focus:border-[#1E40AF] transition-colors"
                    required
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="flex items-center space-x-2 text-sm font-medium text-[#64748B] mb-2">
                    <Tag className="w-4 h-4" />
                    <span>Category</span>
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[20px] focus:outline-none focus:border-[#1E40AF] transition-colors"
                    required
                  >
                    <option value="">Select a category</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Stock Status */}
                <div className="flex items-center space-x-3 p-4 bg-[#F8FAFC] rounded-[20px]">
                  <input
                    type="checkbox"
                    id="inStock"
                    checked={formData.inStock}
                    onChange={(e) =>
                      setFormData({ ...formData, inStock: e.target.checked })
                    }
                    className="w-5 h-5 rounded-[8px] border-2 border-[#E2E8F0] text-[#1E40AF] focus:ring-[#1E40AF] focus:ring-offset-0"
                  />
                  <label htmlFor="inStock" className="text-sm font-medium text-[#0F172A]">
                    Product is currently in stock
                  </label>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setStep("capture")}
                    className="flex-1 py-4 bg-[#F8FAFC] hover:bg-[#F1F5F9] text-[#0F172A] rounded-[24px] transition-colors font-medium border border-[#E2E8F0]"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-4 bg-gradient-to-br from-[#1E40AF] to-[#065F46] text-white rounded-[24px] hover:opacity-90 transition-opacity font-bold"
                  >
                    Submit Verification
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {/* Step 3: Success */}
          {step === "success" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-12"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="w-24 h-24 bg-gradient-to-br from-[#10B981] to-[#059669] rounded-full flex items-center justify-center mx-auto mb-6"
              >
                <CheckCircle className="w-12 h-12 text-white" />
              </motion.div>
              <h3 className="text-3xl font-bold text-[#0F172A] mb-3">
                Verification Submitted!
              </h3>
              <p className="text-[#64748B] mb-6">
                You've earned <span className="font-bold text-[#7C3AED]">+15 points</span>
              </p>
              <div className="bg-[#F8FAFC] rounded-[24px] p-6 max-w-sm mx-auto">
                <h4 className="font-bold text-[#0F172A] mb-3">Verification Details</h4>
                <div className="space-y-2 text-sm text-left">
                  <div className="flex justify-between">
                    <span className="text-[#64748B]">Product:</span>
                    <span className="font-medium text-[#0F172A]">
                      {formData.productName}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#64748B]">Shop:</span>
                    <span className="font-medium text-[#0F172A]">{formData.shop}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#64748B]">Status:</span>
                    <span className="px-2 py-1 bg-[#F59E0B]/10 text-[#F59E0B] rounded-[8px] text-xs font-medium">
                      Pending Review
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
