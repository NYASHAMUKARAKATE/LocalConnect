/**
 * Product Detail Page — full product view with image, description,
 * reviews, shop info, and related products.
 */
import { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router";
import {
    ArrowLeft, Star, MapPin, Phone, ShoppingCart,
    Package, Shield, Truck, Clock, Heart,
} from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { api, API_URL } from "../../../services/api";
import { LocationContext } from "../Root";
import { useCart } from "../../contexts/CartContext";
import { useI18n } from "../../../i18n";
import { ProductGridSkeleton } from "../Skeleton";

interface ProductDetail {
    id: string;
    name: string;
    price: number;
    category: string;
    description: string;
    imageUrl: string;
    stock: number;
    inStock: boolean;
    shop: string;
    shopId: number;
    shopPhone: string;
    shopLocation: string;
    shopLat: number;
    shopLng: number;
    distance: string;
    rating: number;
}

export default function ProductDetailPage() {
    const { productId } = useParams();
    const navigate = useNavigate();
    const { userId, isAuthenticated, userCoords } = useContext(LocationContext);
    const { addToCart } = useCart();
    const { t } = useI18n();

    const [product, setProduct] = useState<ProductDetail | null>(null);
    const [relatedProducts, setRelatedProducts] = useState<ProductDetail[]>([]);
    const [reviews, setReviews] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<"description" | "reviews">("description");

    useEffect(() => {
        if (!productId) return;
        setLoading(true);

        // Fetch product detail
        fetch(`${API_URL}/products/${productId}`)
            .then((r) => r.json())
            .then((item) => {
                setProduct({
                    id: item.id.toString(),
                    name: item.name,
                    price: item.price,
                    category: item.category || "",
                    description: item.description || "No description available.",
                    imageUrl: item.image_url,
                    stock: item.stock ?? 0,
                    inStock: (item.stock ?? 0) > 0,
                    shop: item.shop?.name || "Unknown Shop",
                    shopId: item.shop?.id || 0,
                    shopPhone: item.shop?.phone || "",
                    shopLocation: item.shop?.location || "",
                    shopLat: item.shop?.latitude,
                    shopLng: item.shop?.longitude,
                    distance: item.distance_str || "Nearby",
                    rating: item.shop?.rating || 0,
                });
                setLoading(false);

                // Fetch related products in same category
                if (item.category) {
                    api.getProducts({ category: item.category, page_size: 4, lat: userCoords[0], lng: userCoords[1] })
                        .then((res) => {
                            setRelatedProducts(
                                res.products.filter((p: any) => p.id !== item.id.toString()).slice(0, 4)
                            );
                        })
                        .catch(() => { });
                }

                // Fetch reviews
                if (item.shop?.id) {
                    api.getShopReviews(item.shop.id).then(setReviews).catch(() => { });
                }
            })
            .catch(() => {
                setLoading(false);
                toast.error("Failed to load product");
            });
    }, [productId]);

    const handleAddToCart = () => {
        if (!isAuthenticated) {
            toast.error("Please sign in to add items to cart");
            navigate("/auth");
            return;
        }
        if (product && userId) {
            addToCart({
                id: `temp-${Date.now()}`,
                productId: product.id,
                name: product.name,
                price: product.price,
                imageUrl: product.imageUrl,
                shop: product.shop,
                shopPhone: product.shopPhone,
                shopLocation: product.shopLocation,
                distance: product.distance,
            });
            toast.success(`${product.name} added to cart!`);
        }
    };

    if (loading) return <ProductGridSkeleton count={1} />;
    if (!product) {
        return (
            <div style={{ padding: "4rem", textAlign: "center" }}>
                <h2>Product not found</h2>
                <button onClick={() => navigate("/marketplace")}>Back to Marketplace</button>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ maxWidth: "1200px", margin: "0 auto", padding: "1.5rem" }}
        >
            {/* Back Button */}
            <button
                onClick={() => navigate(-1)}
                style={{
                    display: "flex", alignItems: "center", gap: "8px",
                    background: "none", border: "none", cursor: "pointer",
                    color: "#1E40AF", fontWeight: 500, fontSize: "0.875rem",
                    marginBottom: "1.5rem", padding: "8px 0",
                }}
            >
                <ArrowLeft size={18} /> {t("common.back")}
            </button>

            {/* Product Content */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2.5rem" }}>
                {/* Image */}
                <div style={{
                    borderRadius: "24px",
                    overflow: "hidden",
                    aspectRatio: "1",
                    background: "#f1f5f9",
                }}>
                    <img
                        src={product.imageUrl}
                        alt={product.name}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        onError={(e) => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600"; }}
                    />
                </div>

                {/* Details */}
                <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                    <div>
                        <span style={{
                            fontSize: "0.75rem", fontWeight: 600, color: "#1E40AF",
                            background: "rgba(30,64,175,0.08)", padding: "4px 12px",
                            borderRadius: "8px", textTransform: "uppercase",
                        }}>
                            {product.category}
                        </span>
                    </div>

                    <h1 style={{ fontSize: "2rem", fontWeight: 700, color: "#0f172a", margin: 0, lineHeight: 1.2 }}>
                        {product.name}
                    </h1>

                    {/* Rating */}
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <div style={{ display: "flex", gap: "2px" }}>
                            {[1, 2, 3, 4, 5].map((i) => (
                                <Star key={i} size={16} fill={i <= product.rating ? "#F59E0B" : "none"} color={i <= product.rating ? "#F59E0B" : "#D1D5DB"} />
                            ))}
                        </div>
                        <span style={{ fontSize: "0.875rem", color: "#64748b" }}>
                            ({product.rating.toFixed(1)}) · {reviews.length} {t("product.reviews").toLowerCase()}
                        </span>
                    </div>

                    {/* Price */}
                    <div style={{ fontSize: "2rem", fontWeight: 700, color: "#065F46" }}>
                        ${product.price.toFixed(2)}
                    </div>

                    {/* Stock Status */}
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <Package size={16} color={product.inStock ? "#059669" : "#DC2626"} />
                        <span style={{
                            fontSize: "0.875rem", fontWeight: 500,
                            color: product.inStock ? "#059669" : "#DC2626",
                        }}>
                            {product.inStock ? `${product.stock} ${t("product.stock")}` : t("marketplace.outOfStock")}
                        </span>
                    </div>

                    {/* Shop Info Card */}
                    <div style={{
                        background: "#f8fafc", borderRadius: "16px", padding: "1rem",
                        display: "flex", flexDirection: "column", gap: "8px",
                    }}>
                        <div style={{ fontWeight: 600, fontSize: "0.9375rem", color: "#0f172a" }}>
                            {t("product.soldBy")} {product.shop}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.8125rem", color: "#64748b" }}>
                            <MapPin size={14} /> {product.shopLocation} · {product.distance}
                        </div>
                        {product.shopPhone && (
                            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.8125rem", color: "#64748b" }}>
                                <Phone size={14} /> {product.shopPhone}
                            </div>
                        )}
                    </div>

                    {/* Features */}
                    <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                        {[
                            { icon: Shield, label: "Verified Shop" },
                            { icon: Truck, label: "Delivery Available" },
                            { icon: Clock, label: "Fresh Daily" },
                        ].map(({ icon: Icon, label }) => (
                            <div key={label} style={{
                                display: "flex", alignItems: "center", gap: "6px",
                                fontSize: "0.75rem", color: "#475569", fontWeight: 500,
                            }}>
                                <Icon size={14} color="#1E40AF" /> {label}
                            </div>
                        ))}
                    </div>

                    {/* Add to Cart */}
                    <div style={{ display: "flex", gap: "12px", marginTop: "0.5rem" }}>
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleAddToCart}
                            disabled={!product.inStock}
                            style={{
                                flex: 1, padding: "14px 24px", borderRadius: "16px", border: "none",
                                background: product.inStock
                                    ? "linear-gradient(135deg, #1E40AF, #3B82F6)"
                                    : "#e2e8f0",
                                color: product.inStock ? "white" : "#94a3b8",
                                fontWeight: 600, fontSize: "1rem", cursor: product.inStock ? "pointer" : "not-allowed",
                                display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
                            }}
                        >
                            <ShoppingCart size={20} />
                            {product.inStock ? t("marketplace.addToCart") : t("marketplace.outOfStock")}
                        </motion.button>

                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            style={{
                                width: "52px", height: "52px", borderRadius: "16px",
                                border: "1px solid #e2e8f0", background: "white",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                cursor: "pointer",
                            }}
                        >
                            <Heart size={20} color="#EF4444" />
                        </motion.button>
                    </div>
                </div>
            </div>

            {/* Tabs: Description / Reviews */}
            <div style={{ marginTop: "3rem" }}>
                <div style={{ display: "flex", gap: "0", borderBottom: "2px solid #e2e8f0" }}>
                    {(["description", "reviews"] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            style={{
                                padding: "12px 24px",
                                border: "none",
                                background: "none",
                                fontWeight: activeTab === tab ? 600 : 400,
                                color: activeTab === tab ? "#1E40AF" : "#64748b",
                                borderBottom: activeTab === tab ? "2px solid #1E40AF" : "2px solid transparent",
                                marginBottom: "-2px",
                                cursor: "pointer",
                                fontSize: "0.9375rem",
                                textTransform: "capitalize",
                            }}
                        >
                            {t(`product.${tab}`)} {tab === "reviews" && `(${reviews.length})`}
                        </button>
                    ))}
                </div>

                <div style={{ padding: "1.5rem 0" }}>
                    {activeTab === "description" ? (
                        <p style={{ fontSize: "0.9375rem", color: "#475569", lineHeight: 1.8, maxWidth: "700px" }}>
                            {product.description}
                        </p>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                            {reviews.length === 0 ? (
                                <p style={{ color: "#94a3b8", fontSize: "0.875rem" }}>No reviews yet.</p>
                            ) : (
                                reviews.map((review: any, idx: number) => (
                                    <div key={idx} style={{
                                        padding: "1rem", borderRadius: "12px", background: "#f8fafc",
                                        display: "flex", flexDirection: "column", gap: "6px",
                                    }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                            {[1, 2, 3, 4, 5].map((i) => (
                                                <Star key={i} size={12} fill={i <= review.rating ? "#F59E0B" : "none"} color={i <= review.rating ? "#F59E0B" : "#D1D5DB"} />
                                            ))}
                                        </div>
                                        <p style={{ fontSize: "0.8125rem", color: "#334155" }}>{review.comment}</p>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Related Products */}
            {relatedProducts.length > 0 && (
                <div style={{ marginTop: "2rem" }}>
                    <h3 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "1rem", color: "#0f172a" }}>
                        {t("product.relatedProducts")}
                    </h3>
                    <div style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                        gap: "1rem",
                    }}>
                        {relatedProducts.map((p: any) => (
                            <div
                                key={p.id}
                                onClick={() => navigate(`/product/${p.id}`)}
                                style={{
                                    borderRadius: "16px", overflow: "hidden", background: "white",
                                    boxShadow: "0 1px 3px rgba(0,0,0,0.06)", cursor: "pointer",
                                    transition: "transform 0.2s",
                                }}
                            >
                                <img
                                    src={p.imageUrl}
                                    alt={p.name}
                                    style={{ width: "100%", height: "140px", objectFit: "cover" }}
                                    onError={(e) => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=300"; }}
                                />
                                <div style={{ padding: "0.75rem" }}>
                                    <div style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#0f172a" }}>{p.name}</div>
                                    <div style={{ fontSize: "0.875rem", fontWeight: 700, color: "#065F46", marginTop: "4px" }}>${p.price.toFixed(2)}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </motion.div>
    );
}
