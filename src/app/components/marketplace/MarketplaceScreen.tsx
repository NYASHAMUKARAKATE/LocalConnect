import { useState, useEffect, useCallback, useRef } from "react";
import { api, API_URL } from "../../../services/api";
import { toast } from "sonner";
import { Search, SlidersHorizontal, TrendingUp, X, ChevronDown, Map as MapIcon, Grid } from "lucide-react";
import ProductCard from "./ProductCard";
import GroupBuyCard from "./GroupBuyCard";
import FloatingAIAssistant from "../ai-assistant/FloatingAIAssistant";
import MapView from "../map/MapView";
import ShopInteractionModal from "./ShopInteractionModal";
import { useLocation } from "../../components/Root";

export default function MarketplaceScreen() {
  const { userCoords } = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<string>("newest");
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "map">("grid");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [categories, setCategories] = useState<string[]>([
    "Vegetables", "Fruits", "Grains", "Dairy", "Bakery",
    "Meat & Poultry", "Beverages", "Snacks", "Personal Care",
    "Household", "Fashion", "Electronics", "Other"
  ]);
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Map Modal State
  const [mapModalOpen, setMapModalOpen] = useState(false);
  const [mapSelectedShopId, setMapSelectedShopId] = useState<number>(0);
  const [mapSelectedShopName, setMapSelectedShopName] = useState("");

  // Dedicated Map State for rendering ALL shops + lively updating
  const [mapShops, setMapShops] = useState<any[]>([]);
  const ws = useRef<WebSocket | null>(null);

  // Load all shops strictly for the Map (decoupled from filtered products)
  useEffect(() => {
    const fetchAllShops = async () => {
      try {
        const shopsData = await api.getAllShops();
        setMapShops(shopsData);
      } catch (e) {
        console.error("Failed to load map shops", e);
      }
    };
    fetchAllShops();

    // Setup WebSocket connection for live new-shop broadcasts
    const baseApiUrl = API_URL || "http://127.0.0.1:8000/api";
    const wsBaseUrl = baseApiUrl.replace(/^http/, "ws");
    const wsUrl = `${wsBaseUrl}/notifications/ws/public`;

    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      console.log("Connected to public map shop broadcast channel");
    };

    ws.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "new_shop") {
          // Append the incoming shop to the existing map rendering array
          setMapShops(prev => {
            // Prevent duplicates just in case
            if (prev.find(s => s.id === data.shop.id)) return prev;
            return [...prev, data.shop];
          });
          toast.info(`New shop joined: ${data.shop.name}!`, { duration: 4000 });
        }
      } catch (e) {
        console.error("Malformed public websocket msg", e);
      }
    };

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, []);

  // Categories are now hardcoded for visibility of all options
  useEffect(() => {
    // We can still optionally fetch from API if we want dynamic ones, 
    // but the hardcoded ones ensure all categories are shown.
  }, []);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const filters: any = {};
      if (searchQuery.trim()) filters.search = searchQuery.trim();
      if (selectedCategory) filters.category = selectedCategory;
      if (minPrice) filters.min_price = parseFloat(minPrice);
      if (maxPrice) filters.max_price = parseFloat(maxPrice);
      if (sortBy === "price_asc" || sortBy === "price_desc" || sortBy === "popular" || sortBy === "distance") {
        filters.sort_by = sortBy;
      }
      if (userCoords[0] !== -17.8252 && userCoords[1] !== 31.0335) {
        filters.lat = userCoords[0];
        filters.lng = userCoords[1];
      }
      const data = await api.getProducts(filters);
      setProducts(data);
    } catch (error) {
      console.error("Failed to load products", error);
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedCategory, minPrice, maxPrice, sortBy]);

  useEffect(() => {
    const debounce = setTimeout(loadProducts, 300);
    return () => clearTimeout(debounce);
  }, [loadProducts]);

  const clearFilters = () => {
    setSelectedCategory("");
    setMinPrice("");
    setMaxPrice("");
    setSortBy("newest");
  };

  const hasActiveFilters = selectedCategory || minPrice || maxPrice || sortBy !== "newest";

  const sortOptions = [
    { value: "distance", label: "Nearest to Me" },
    { value: "newest", label: "Newest" },
    { value: "price_asc", label: "Price: Low → High" },
    { value: "price_desc", label: "Price: High → Low" },
    { value: "popular", label: "Most Popular" },
  ];

  return (
    <div className="min-h-screen pb-20">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-600 to-emerald-600 px-4 py-12">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-lg md:text-4xl font-bold text-white mb-4">
            Discover Local Shops
          </h1>
          <p className="text-lg text-white/80 mb-8">
            Support your community, shop local
          </p>

          {/* Search Bar */}
          <div className="flex space-x-3">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products, shops..."
                className="w-full pl-12 pr-4 py-4 bg-white rounded-[32px] focus:outline-none focus:ring-2 focus:ring-white/50"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-6 py-4 rounded-[32px] transition-colors backdrop-blur-sm ${showFilters || hasActiveFilters
                ? "bg-white text-blue-600"
                : "bg-white/20 hover:bg-white/30 text-white"
                }`}
            >
              <SlidersHorizontal className="w-5 h-5" />
            </button>
          </div>

          {/* Category Tabs */}
          {categories.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCategory("")}
                className={`px-5 py-2.5 rounded-full font-medium text-sm transition-all transform hover:scale-105 ${!selectedCategory
                  ? "bg-white text-blue-600 shadow-md"
                  : "bg-white/20 text-white hover:bg-white/30"
                  }`}
              >
                All Categories
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat === selectedCategory ? "" : cat)}
                  className={`px-5 py-2.5 rounded-full font-medium text-sm transition-all transform hover:scale-105 capitalize ${selectedCategory === cat
                    ? "bg-white text-emerald-600 shadow-md"
                    : "bg-white/20 text-white hover:bg-white/30"
                    }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          {/* Expanded Filters */}
          {showFilters && (
            <div className="mt-4 bg-white/10 backdrop-blur-sm rounded-2xl p-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Sort */}
                <div>
                  <label className="text-xs text-white/70 mb-1 block">Sort by</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white rounded-xl text-sm text-slate-900 outline-none"
                  >
                    {sortOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                {/* Min Price */}
                <div>
                  <label className="text-xs text-white/70 mb-1 block">Min Price ($)</label>
                  <input
                    type="number"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    placeholder="0"
                    className="w-full px-4 py-2.5 bg-white rounded-xl text-sm text-slate-900 outline-none"
                  />
                </div>
                {/* Max Price */}
                <div>
                  <label className="text-xs text-white/70 mb-1 block">Max Price ($)</label>
                  <input
                    type="number"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    placeholder="999"
                    className="w-full px-4 py-2.5 bg-white rounded-xl text-sm text-slate-900 outline-none"
                  />
                </div>
              </div>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-xs text-white/80 underline hover:text-white"
                >
                  Clear all filters
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* All Products */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {selectedCategory ? `${selectedCategory} Products` : "Products Near You"}
              </h2>
              <span className="text-sm text-slate-500">
                {products.length} result{products.length !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setViewMode("grid")}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${viewMode === "grid" ? "bg-white shadow text-blue-600" : "text-slate-500 hover:text-slate-700"
                  }`}
              >
                <Grid className="w-4 h-4" />
                <span>Grid</span>
              </button>
              <button
                onClick={() => setViewMode("map")}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${viewMode === "map" ? "bg-white shadow text-blue-600" : "text-slate-500 hover:text-slate-700"
                  }`}
              >
                <MapIcon className="w-4 h-4" />
                <span>Map</span>
              </button>
            </div>
          </div>

          {loading && viewMode === "grid" ? (
            <div className="text-center py-12 text-slate-500">
              Loading products...
            </div>
          ) : products.length === 0 && viewMode === "grid" ? (
            <div className="text-center py-12">
              <p className="text-lg font-medium text-slate-900 mb-1">No products found</p>
              <p className="text-sm text-slate-500">Try adjusting your search or filters</p>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 hover:gap-8 transition-all duration-300">
              {products.map((product) => (
                <ProductCard key={product.id} product={{
                  id: product.id,
                  name: product.name,
                  price: product.price,
                  shop: product.shop,
                  shopId: product.shopId || 0,
                  distance: product.distance,
                  rating: product.rating,
                  imageUrl: product.imageUrl || "",
                  inStock: product.inStock,
                  shopPhone: product.shopPhone,
                  shopLocation: product.shopLocation,
                }} />
              ))}
            </div>
          ) : (
            <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-200">
              <MapView
                userLocation={userCoords}
                onShopClick={(shopId, shopName) => {
                  setMapSelectedShopId(shopId);
                  setMapSelectedShopName(shopName);
                  setMapModalOpen(true);
                }}
                shops={mapShops.map(s => ({
                  id: s.id,
                  name: s.name,
                  latitude: s.latitude,
                  longitude: s.longitude,
                  location: s.location,
                  distance: "Nearby"
                }))}
              />
            </div>
          )}
        </div>
      </div>

      {/* Floating AI Assistant */}
      <FloatingAIAssistant />

      {/* Map Shop Modal */}
      {mapModalOpen && (
        <ShopInteractionModal
          isOpen={mapModalOpen}
          onClose={() => setMapModalOpen(false)}
          shopName={mapSelectedShopName}
          shopId={mapSelectedShopId}
          initialTab="chat"
        />
      )}
    </div>
  );
}
