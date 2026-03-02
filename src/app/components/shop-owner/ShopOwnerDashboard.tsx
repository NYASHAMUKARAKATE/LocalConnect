import { useState, useEffect, useRef } from "react";
import { api } from "../../../services/api";
import { toast } from "sonner";
import { motion } from "motion/react";
import {
  Package,
  DollarSign,
  TrendingUp,
  Plus,
  Edit,
  Trash2,
  Phone,
  MapPin,
  Clock,
  BarChart3,
  ShoppingCart,
  MessageCircle,
  Star,
  Send,
  User
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  sold: number;
  image: string;
}

interface Sale {
  id: string;
  productName: string;
  customer: string;
  amount: number;
  date: string;
  status: "completed" | "pending" | "cancelled";
  deliveryStatus: string;
}

export default function ShopOwnerDashboard() {
  const [activeTab, setActiveTab] = useState<"inventory" | "sales" | "analytics" | "messages" | "reviews">("inventory");
  const [showAddProduct, setShowAddProduct] = useState(false);

  const [shopInfo, setShopInfo] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const wsRef = useRef<WebSocket | null>(null);

  const [newProduct, setNewProduct] = useState({
    name: "",
    category: "",
    price: "",
    stock: "",
    description: "A great local product",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const PRODUCT_CATEGORIES = [
    "Vegetables", "Fruits", "Grains", "Dairy", "Bakery",
    "Meat & Poultry", "Beverages", "Snacks", "Personal Care",
    "Household", "Fashion", "Electronics", "Other"
  ];
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const shop = await api.getMyShop();
        setShopInfo(shop);

        const [productsData, ordersData, analyticsData, reviewsData, chatHistory] = await Promise.all([
          api.getShopProductsManaged(),
          api.getShopOrders(),
          api.getShopAnalytics(),
          api.getShopReviews(shop.id),
          api.getChatHistory(shop.id)
        ]);

        setInventory(productsData);
        setOrders(ordersData);
        setAnalytics(analyticsData);
        setReviews(reviewsData);
        setMessages(chatHistory);

        // Setup WebSocket for shop owner
        setupWebSocket(shop.id);

      } catch (error) {
        console.error("Failed to load dashboard data", error);
        toast.error("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };
    loadDashboardData();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const setupWebSocket = (shopId: number) => {
    if (wsRef.current) wsRef.current.close();
    const wsUrl = `ws://localhost:8000/api/chat/ws/${shopId}`;
    const ws = new WebSocket(wsUrl);

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      setMessages(prev => [...prev, message]);
    };

    wsRef.current = ws;
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !wsRef.current || !shopInfo) return;

    // We assume the shop owner's ID is the shopInfo.owner_id
    const payload = {
      sender_id: shopInfo.owner_id,
      content: newMessage.trim()
    };

    wsRef.current.send(JSON.stringify(payload));
    setNewMessage('');
  };

  // Calculate Stats
  const totalRevenue = analytics?.total_revenue || 0;
  const itemsSold = analytics?.total_orders || 0; // Or calculate total items if needed
  const totalProducts = analytics?.active_products || inventory.length;

  // Prepare Recent Sales from Orders
  const recentSales: Sale[] = orders.map((order) => ({
    id: order.id.toString(),
    productName: order.items && order.items.length > 0 && order.items[0].product ? `${order.items[0].product.name} + ${order.items.length - 1} others` : "Order",
    customer: `Customer #${order.customer_id}`, // We might need to fetch customer name or have it in order
    amount: order.total_amount,
    date: new Date(order.created_at).toLocaleString(),
    status: order.status,
    deliveryStatus: order.delivery_status || "Pending"
  }));

  // Analytics data from backend
  const salesTrendData = analytics?.daily_sales || [];

  const categoryData = analytics?.category_breakdown || [];

  const topProducts = analytics?.top_products?.map((p: any) => ({
    name: p.name,
    sold: p.sold,
    revenue: p.revenue
  })) || [];

  const customerSegments = analytics?.customer_segments?.map((s: any) => ({
    name: s.segment_name,
    value: s.customer_count
  })) || [];

  const revenueForecast = analytics?.revenue_forecast || 0;

  const handleUpdateDelivery = async (orderId: string, newStatus: string) => {
    try {
      await api.updateDeliveryStatus(parseInt(orderId), newStatus);
      toast.success("Delivery status updated!");
      // soft update
      setOrders(orders.map(o => o.id.toString() === orderId ? { ...o, delivery_status: newStatus } : o));
    } catch (e) {
      toast.error("Failed to update status");
    }
  };

  const handleAddProduct = async () => {
    try {
      if (!newProduct.name || !newProduct.price || !newProduct.stock) {
        toast.error("Please fill in all required fields");
        return;
      }

      setIsUploading(true);
      let uploadedImageUrl = "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80"; // placeholder
      if (imageFile) {
        try {
          const uploadRes = await api.uploadImage(imageFile);
          uploadedImageUrl = `http://localhost:8000${uploadRes.url}`;
        } catch (e) {
          console.error("Image upload failed", e);
          toast.error("Image upload failed, using placeholder.");
        }
      }

      const res = await api.addShopProduct({
        name: newProduct.name,
        category: newProduct.category || "Other",
        price: parseFloat(newProduct.price),
        stock: parseInt(newProduct.stock, 10),
        description: newProduct.description,
        image_url: uploadedImageUrl
      });

      setInventory([...inventory, res]);
      setShowAddProduct(false);
      setNewProduct({ name: "", category: "", price: "", stock: "", description: "A great local product" });
      setImageFile(null);
      setImagePreview(null);
      toast.success("Product added successfully!");
    } catch (err) {
      toast.error("Failed to add product");
    } finally {
      setIsUploading(false);
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      await api.deleteShopProduct(parseInt(id, 10));
      setInventory(inventory.filter(p => p.id.toString() !== id.toString()));
      toast.success("Product deleted");
    } catch (err) {
      toast.error("Failed to delete product");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-emerald-500/10 text-emerald-500";
      case "pending": return "bg-amber-500/10 text-amber-500";
      case "cancelled": return "bg-red-500/10 text-red-500";
      default: return "bg-slate-500/10 text-slate-500";
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-emerald-600 text-white px-6 py-8">
        <div className="max-w-6xl mx-auto">
          {loading ? (
            <h1 className="text-lg font-bold mb-2">Loading Shop...</h1>
          ) : shopInfo ? (
            <>
              <h1 className="text-lg font-bold mb-2">{shopInfo.name}</h1>
              <div className="flex flex-col sm:flex-row gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <Phone className="w-4 h-4" />
                  <span>{shopInfo.phone}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4" />
                  <span>{shopInfo.location}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span>⭐ {shopInfo.rating || 5.0}</span>
                </div>
              </div>
            </>
          ) : (
            <h1 className="text-lg font-bold mb-2">Shop Not Found</h1>
          )}
        </div>
      </div>

      {/* Stats Overview */}
      <div className="max-w-6xl mx-auto px-6 -mt-8 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-[24px] p-6 shadow-lg"
          >
            <div className="flex items-center justify-between mb-2">
              <Package className="w-8 h-8 text-blue-600" />
              <span className="text-lg font-bold text-slate-900">{totalProducts}</span>
            </div>
            <p className="text-sm text-slate-500">Total Products</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-[24px] p-6 shadow-lg"
          >
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="w-8 h-8 text-emerald-500" />
              <span className="text-lg font-bold text-slate-900">${totalRevenue.toFixed(2)}</span>
            </div>
            <p className="text-sm text-slate-500">Total Revenue</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white rounded-[24px] p-6 shadow-lg border border-blue-200"
          >
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-8 h-8 text-blue-500" />
              <span className="text-lg font-bold text-slate-900">${revenueForecast.toFixed(2)}</span>
            </div>
            <p className="text-sm text-slate-500">7-Day Forecast</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-[24px] p-6 shadow-lg"
          >
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-8 h-8 text-emerald-600" />
              <span className="text-lg font-bold text-slate-900">{itemsSold}</span>
            </div>
            <p className="text-sm text-slate-500">Items Sold</p>
          </motion.div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-6xl mx-auto px-6 mb-6">
        <div className="bg-white rounded-[32px] p-2 shadow-lg inline-flex space-x-2">
          <button
            onClick={() => setActiveTab("inventory")}
            className={`px-6 py-3 rounded-[24px] font-medium transition-all ${activeTab === "inventory"
              ? "bg-gradient-to-r from-blue-600 to-emerald-600 text-white shadow-lg"
              : "text-slate-500 hover:bg-slate-100"
              }`}
          >
            Inventory
          </button>
          <button
            onClick={() => setActiveTab("sales")}
            className={`px-6 py-3 rounded-[24px] font-medium transition-all ${activeTab === "sales"
              ? "bg-gradient-to-r from-blue-600 to-emerald-600 text-white shadow-lg"
              : "text-slate-500 hover:bg-slate-100"
              }`}
          >
            Sales
          </button>
          <button
            onClick={() => setActiveTab("analytics")}
            className={`px-6 py-3 rounded-[24px] font-medium transition-all ${activeTab === "analytics"
              ? "bg-gradient-to-r from-blue-600 to-emerald-600 text-white shadow-lg"
              : "text-slate-500 hover:bg-slate-100"
              }`}
          >
            Analytics
          </button>
          <button
            onClick={() => setActiveTab("messages")}
            className={`px-6 py-3 rounded-[24px] font-medium transition-all ${activeTab === "messages"
              ? "bg-gradient-to-r from-blue-600 to-emerald-600 text-white shadow-lg"
              : "text-slate-500 hover:bg-slate-100"
              }`}
          >
            Messages
          </button>
          <button
            onClick={() => setActiveTab("reviews")}
            className={`px-6 py-3 rounded-[24px] font-medium transition-all ${activeTab === "reviews"
              ? "bg-gradient-to-r from-blue-600 to-emerald-600 text-white shadow-lg"
              : "text-slate-500 hover:bg-slate-100"
              }`}
          >
            Reviews
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6">
        {/* Inventory Tab */}
        {activeTab === "inventory" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-slate-900">Product Inventory</h2>
              <button
                onClick={() => setShowAddProduct(!showAddProduct)}
                className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-emerald-600 text-white px-6 py-3 rounded-[24px] shadow-lg hover:shadow-xl transition-all"
              >
                <Plus className="w-5 h-5" />
                <span>Add Product</span>
              </button>
            </div>

            {showAddProduct && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="bg-white rounded-[24px] p-6 shadow-lg mb-6"
              >
                <h3 className="font-bold text-slate-900 mb-4">Add New Product</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Product Name"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                    className="px-4 py-3 border border-slate-200 rounded-[16px] focus:outline-none focus:border-blue-600"
                  />
                  <select
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                    className="px-4 py-3 border border-slate-200 rounded-[16px] focus:outline-none focus:border-blue-600 bg-white"
                  >
                    <option value="">Select Category</option>
                    {PRODUCT_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    placeholder="Price ($)"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                    className="px-4 py-3 border border-slate-200 rounded-[16px] focus:outline-none focus:border-blue-600"
                  />
                  <input
                    type="number"
                    placeholder="Stock Quantity"
                    value={newProduct.stock}
                    onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                    className="px-4 py-3 border border-slate-200 rounded-[16px] focus:outline-none focus:border-blue-600"
                  />
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-slate-500 mb-2">Product Image (Optional)</label>
                    <div className="flex items-center space-x-4">
                      {imagePreview && (
                        <div className="w-16 h-16 rounded-[12px] overflow-hidden border border-slate-200 shrink-0">
                          <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            const file = e.target.files[0];
                            setImageFile(file);
                            setImagePreview(URL.createObjectURL(file));
                          }
                        }}
                        className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-100 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end space-x-3 mt-4">
                  <button
                    onClick={() => setShowAddProduct(false)}
                    className="px-6 py-3 border border-slate-200 rounded-[16px] text-slate-500 hover:bg-slate-100 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddProduct}
                    disabled={isUploading}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-emerald-600 text-white rounded-[16px] hover:shadow-lg transition-all disabled:opacity-50"
                  >
                    {isUploading ? "Adding..." : "Add Product"}
                  </button>
                </div>
              </motion.div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {inventory.map((product, idx) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-white rounded-[24px] p-4 shadow-lg hover:shadow-xl transition-all"
                >
                  {product.image_url ? (
                    <div className="w-full h-32 rounded-[16px] mb-4 overflow-hidden">
                      <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-full h-32 bg-gradient-to-br from-[#E0F2FE] to-[#D1FAE5] rounded-[16px] mb-4 flex items-center justify-center">
                      <Package className="w-12 h-12 text-blue-600" />
                    </div>
                  )}
                  <h3 className="font-bold text-slate-900 mb-2">{product.name}</h3>
                  <p className="text-sm text-slate-500 mb-3">{product.category}</p>
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Price:</span>
                      <span className="font-bold text-blue-600">${product.price}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Stock:</span>
                      <span className={`font-bold ${product.stock < 30 ? "text-red-500" : "text-emerald-500"}`}>
                        {product.stock} units
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Sold:</span>
                      <span className="font-bold text-emerald-600">{product.sold} units</span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button className="flex-1 flex items-center justify-center space-x-2 py-2 border border-slate-200 rounded-[16px] text-blue-600 hover:bg-blue-50 transition-all">
                      <Edit className="w-4 h-4" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => deleteProduct(product.id.toString())}
                      className="flex items-center justify-center px-4 py-2 border border-red-200 rounded-[16px] text-red-500 hover:bg-red-50 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Sales Tab */}
        {activeTab === "sales" && (
          <div>
            <h2 className="text-lg font-bold text-slate-900 mb-6">Recent Sales</h2>
            <div className="space-y-4">
              {recentSales.map((sale, idx) => (
                <motion.div
                  key={sale.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-white rounded-[24px] p-6 shadow-lg hover:shadow-xl transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-bold text-slate-900 mb-1">{sale.productName}</h3>
                      <div className="flex items-center space-x-4 text-sm text-slate-500">
                        <span>Customer: {sale.customer}</span>
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>{sale.date}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-lg font-bold text-slate-900">${sale.amount}</p>
                      </div>
                      <span className={`px-4 py-2 rounded-[16px] text-sm font-medium ${getStatusColor(sale.status)}`}>
                        {sale.status}
                      </span>
                      <select
                        value={sale.deliveryStatus}
                        onChange={(e) => handleUpdateDelivery(sale.id, e.target.value)}
                        className="ml-2 px-3 py-2 bg-slate-100 border-none rounded-[16px] text-sm text-slate-900 font-medium outline-none"
                      >
                        <option value="Pending">Pending</option>
                        <option value="Ready for Pickup">Ready for Pickup</option>
                        <option value="Out for Delivery">Out for Delivery</option>
                        <option value="Picked Up">Picked Up</option>
                        <option value="Delivered">Delivered</option>
                      </select>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === "analytics" && (
          <div className="space-y-6">
            {/* Sales Trend */}
            <div className="bg-white rounded-[24px] p-6 shadow-lg">
              <div className="flex items-center space-x-2 mb-6">
                <BarChart3 className="w-6 h-6 text-blue-600" />
                <h3 className="text-lg font-bold text-slate-900">Weekly Sales Trend</h3>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={salesTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="day" stroke-slate-500 />
                  <YAxis stroke-slate-500 />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #E2E8F0",
                      borderRadius: "12px",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="sales"
                    stroke="#1E40AF"
                    strokeWidth={3}
                    dot={{ fill: "#1E40AF", r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Category Distribution & Top Products */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Customer Segments */}
              {customerSegments.length > 0 && (
                <div className="bg-white rounded-[24px] p-6 shadow-lg">
                  <h3 className="text-lg font-bold text-slate-900 mb-6">Customer Segmentation</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={customerSegments}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {customerSegments.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={['#10B981', '#3B82F6', '#F59E0B', '#EF4444'][index % 4]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Top Products */}
              <div className="bg-white rounded-[24px] p-6 shadow-lg">
                <h3 className="text-lg font-bold text-slate-900 mb-6">Sales by Category</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {categoryData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Top Products */}
              <div className="bg-white rounded-[24px] p-6 shadow-lg">
                <h3 className="text-lg font-bold text-slate-900 mb-6">Top Selling Products</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={topProducts} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis type="number" stroke-slate-500 />
                    <YAxis dataKey="name" type="category" stroke-slate-500 width={100} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#fff",
                        border: "1px solid #E2E8F0",
                        borderRadius: "12px",
                      }}
                    />
                    <Bar dataKey="sold" fill="#065F46" radius={[0, 8, 8, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* Messages Tab */}
        {activeTab === "messages" && (
          <div className="bg-white rounded-[32px] shadow-lg flex flex-col h-[600px] overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-200 p-6 flex items-center space-x-3 shrink-0">
              <MessageCircle className="w-6 h-6 text-blue-600" />
              <h2 className="text-lg font-bold text-slate-900">Customer Chat</h2>
            </div>
            <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-50">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-500">
                  <MessageCircle className="w-12 h-12 mb-4 opacity-50" />
                  <p>No messages yet.</p>
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const isOwner = msg.sender_id === shopInfo?.owner_id;
                  return (
                    <div key={idx} className={`flex ${isOwner ? 'justify-end' : 'justify-start'}`}>
                      {!isOwner && (
                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center mr-2 shrink-0">
                          <User className="w-4 h-4 text-slate-500" />
                        </div>
                      )}
                      <div className={`max-w-[70%] rounded-[20px] px-4 py-3 ${isOwner
                        ? 'bg-blue-600 text-white rounded-tr-none'
                        : 'bg-white text-slate-900 border border-slate-200 rounded-tl-none'
                        }`}>
                        {!isOwner && <p className="text-xs font-bold text-slate-500 mb-1">Customer #{msg.sender_id}</p>}
                        <p>{msg.content}</p>
                        <span className={`text-[10px] block mt-1 ${isOwner ? 'text-white/70 text-right' : 'text-slate-500'}`}>
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <div className="p-4 bg-white border-t border-slate-200 shrink-0">
              <form onSubmit={handleSendMessage} className="flex space-x-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a response..."
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-full px-5 py-3 focus:outline-none focus:border-blue-600"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="w-12 h-12 bg-gradient-to-br from-blue-600 to-emerald-600 rounded-full flex items-center justify-center text-white disabled:opacity-50 transition-colors"
                >
                  <Send className="w-5 h-5 -ml-1" />
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Reviews Tab */}
        {activeTab === "reviews" && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900 mb-6">Customer Reviews</h2>
            {reviews.length === 0 ? (
              <div className="bg-white rounded-[24px] p-12 text-center shadow-lg">
                <Star className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-slate-900 mb-2">No Reviews Yet</h3>
                <p className="text-slate-500">When customers leave reviews for your shop, they will appear here.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {reviews.map((review) => (
                  <motion.div
                    key={review.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white p-6 rounded-[24px] shadow-lg border border-slate-200"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold">
                          #{review.customer_id}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-sm">Customer #{review.customer_id}</p>
                          <p className="text-xs text-slate-500">{new Date(review.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${i < review.rating ? 'text-amber-500 fill-amber-500' : 'text-slate-300'}`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-[#334155] leading-relaxed">"{review.comment}"</p>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
