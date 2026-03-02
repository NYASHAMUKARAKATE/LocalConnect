import React, { useState, useEffect, useRef } from 'react';
import { Camera, Upload, X, ArrowLeft, CheckCircle2, Box, Info } from 'lucide-react';
import { api } from '../../../services/api';
import { toast } from 'sonner';

interface Shop {
    id: string;
    name: string;
    location: string;
}

export default function AmbassadorAddProduct({ onClose }: { onClose: () => void }) {
    const [shops, setShops] = useState<Shop[]>([]);
    const [loadingShops, setLoadingShops] = useState(true);

    const [selectedShopId, setSelectedShopId] = useState('');
    const [name, setName] = useState('');
    const [category, setCategory] = useState('');
    const [price, setPrice] = useState('');
    const [stock, setStock] = useState('');
    const [description, setDescription] = useState('');

    const [image, setImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const fetchShops = async () => {
            try {
                const data = await api.getVerifiedShops();
                setShops(data);
            } catch (error) {
                toast.error('Failed to load verified shops');
            } finally {
                setLoadingShops(false);
            }
        };
        fetchShops();
    }, []);

    const handleImageCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                toast.error('Image must be less than 5MB');
                return;
            }
            setImage(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedShopId || !name || !category || !price || !stock) {
            toast.error('Please fill in all required fields');
            return;
        }

        if (!image) {
            toast.error('Please add a photo of the product');
            return;
        }

        setIsSubmitting(true);
        try {
            // 1. Upload image
            toast.loading('Uploading image...', { id: 'adding-product' });
            const { url } = await api.uploadImage(image);

            // 2. Add product
            toast.loading('Adding product...', { id: 'adding-product' });
            const productData = {
                name,
                category,
                price: parseFloat(price),
                stock: parseInt(stock, 10),
                description,
                image_url: url
            };

            await api.addAmbassadorProduct(parseInt(selectedShopId, 10), productData);

            toast.success('Product added successfully!', { id: 'adding-product' });

            // Cleanup
            setSelectedShopId('');
            setName('');
            setCategory('');
            setPrice('');
            setStock('');
            setDescription('');
            setImage(null);
            setImagePreview(null);

        } catch (error: any) {
            console.error(error);
            toast.error(error.message || 'Failed to add product', { id: 'adding-product' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-[#0F172A]/80 backdrop-blur-sm z-50 flex flex-col">
            <div className="flex-1 bg-white overflow-y-auto w-full max-w-2xl mx-auto shadow-2xl">
                {/* Header */}
                <div className="sticky top-0 bg-white/90 backdrop-blur-md px-4 py-4 border-b border-[#E2E8F0] flex items-center justify-between z-10">
                    <div className="flex items-center space-x-3">
                        <button onClick={onClose} className="p-2 hover:bg-[#F1F5F9] rounded-full transition-colors">
                            <ArrowLeft className="w-6 h-6 text-[#64748B]" />
                        </button>
                        <h2 className="text-xl font-bold text-[#0F172A]">Add Shop Item</h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-[#F1F5F9] rounded-full transition-colors">
                        <X className="w-6 h-6 text-[#64748B]" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 sm:p-6 pb-24">
                    <div className="mb-6 bg-blue-50 text-blue-800 p-4 rounded-[20px] flex gap-3 text-sm">
                        <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <p>
                            Use this form to add products on behalf of verified owners. The product will immediately appear in their shop inventory.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Shop Selection */}
                        <div>
                            <label className="block text-sm font-medium text-[#64748B] mb-2">
                                Select Shop *
                            </label>
                            <select
                                required
                                value={selectedShopId}
                                onChange={(e) => setSelectedShopId(e.target.value)}
                                disabled={loadingShops}
                                className="w-full bg-[#F8FAFC] border-2 border-[#E2E8F0] rounded-[16px] px-4 py-3 focus:border-[#1E40AF] focus:ring-4 focus:ring-[#1E40AF]/10 outline-none transition-all"
                            >
                                <option value="">{loadingShops ? 'Loading shops...' : 'Select a verified shop'}</option>
                                {shops.map(shop => (
                                    <option key={shop.id} value={shop.id}>{shop.name} ({shop.location})</option>
                                ))}
                            </select>
                        </div>

                        {/* Photo Capture */}
                        <div>
                            <label className="block text-sm font-medium text-[#64748B] mb-2">
                                Product Photo *
                            </label>
                            {imagePreview ? (
                                <div className="relative aspect-video bg-[#F8FAFC] rounded-[24px] overflow-hidden border-2 border-[#E2E8F0]">
                                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setImage(null);
                                            setImagePreview(null);
                                        }}
                                        className="absolute top-4 right-4 p-2 bg-white/90 backdrop-blur-sm rounded-full text-red-500 hover:bg-white shadow-lg transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            ) : (
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className="aspect-video bg-[#F8FAFC] rounded-[24px] border-2 border-dashed border-[#CBD5E1] hover:border-[#1E40AF] hover:bg-[#F1F5F9] transition-all flex flex-col items-center justify-center cursor-pointer group"
                                >
                                    <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                        <Camera className="w-8 h-8 text-[#94A3B8] group-hover:text-[#1E40AF]" />
                                    </div>
                                    <p className="text-[#64748B] font-medium">Capture or upload photo</p>
                                    <p className="text-sm text-[#94A3B8] mt-1">Tap here to open camera</p>
                                </div>
                            )}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                capture="environment"
                                className="hidden"
                                onChange={handleImageCapture}
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Product Name */}
                            <div>
                                <label className="block text-sm font-medium text-[#64748B] mb-2">Product Name *</label>
                                <input
                                    required
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g. Fresh Tomatoes"
                                    className="w-full bg-[#F8FAFC] border-2 border-[#E2E8F0] rounded-[16px] px-4 py-3 focus:border-[#1E40AF] outline-none transition-colors"
                                />
                            </div>

                            {/* Category */}
                            <div>
                                <label className="block text-sm font-medium text-[#64748B] mb-2">Category *</label>
                                <select
                                    required
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                    className="w-full bg-[#F8FAFC] border-2 border-[#E2E8F0] rounded-[16px] px-4 py-3 focus:border-[#1E40AF] outline-none transition-colors"
                                >
                                    <option value="">Select Category</option>
                                    <option value="Vegetables">Vegetables</option>
                                    <option value="Fruits">Fruits</option>
                                    <option value="Grains">Grains</option>
                                    <option value="Dairy">Dairy</option>
                                    <option value="Meat">Meat & Poultry</option>
                                    <option value="Bakery">Bakery</option>
                                    <option value="Snacks">Snacks</option>
                                    <option value="Beverages">Beverages</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {/* Price */}
                            <div>
                                <label className="block text-sm font-medium text-[#64748B] mb-2">Price ($) *</label>
                                <input
                                    required
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={price}
                                    onChange={(e) => setPrice(e.target.value)}
                                    placeholder="0.00"
                                    className="w-full bg-[#F8FAFC] border-2 border-[#E2E8F0] rounded-[16px] px-4 py-3 focus:border-[#1E40AF] outline-none transition-colors"
                                />
                            </div>

                            {/* Stock */}
                            <div>
                                <label className="block text-sm font-medium text-[#64748B] mb-2">Available Quantity *</label>
                                <input
                                    required
                                    type="number"
                                    min="1"
                                    value={stock}
                                    onChange={(e) => setStock(e.target.value)}
                                    placeholder="e.g. 50"
                                    className="w-full bg-[#F8FAFC] border-2 border-[#E2E8F0] rounded-[16px] px-4 py-3 focus:border-[#1E40AF] outline-none transition-colors"
                                />
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-medium text-[#64748B] mb-2">Description</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Brief description of the product and its quality..."
                                rows={3}
                                className="w-full bg-[#F8FAFC] border-2 border-[#E2E8F0] rounded-[16px] px-4 py-3 focus:border-[#1E40AF] outline-none transition-colors resize-none"
                            />
                        </div>

                        {/* Actions */}
                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-[#1E40AF] to-[#0F172A] text-white py-4 rounded-[20px] font-bold text-lg hover:shadow-lg transition-all disabled:opacity-70"
                            >
                                {isSubmitting ? (
                                    <>
                                        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        <span>Adding Product...</span>
                                    </>
                                ) : (
                                    <>
                                        <Upload className="w-5 h-5" />
                                        <span>Add to Shop Inventory</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
