import { useState, useEffect } from "react";
import { TrendingUp, Users, Store, Package, MapPin, UserCheck, ShieldCheck, Mail, Phone, Calendar } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import DemandHeatmap from "./DemandHeatmap";
import { api } from "../../../services/api";
import { toast } from "sonner";

export default function AdminDashboard() {
  const [selectedCity, setSelectedCity] = useState("Harare");
  const [loading, setLoading] = useState(true);
  const [adminStats, setAdminStats] = useState({
    total_users: 0,
    total_shops: 0,
    total_orders: 0,
    total_volume: 0
  });

  // Tab State
  const [activeTab, setActiveTab] = useState<"overview" | "customers" | "shops" | "ambassadors">("overview");

  // Data States
  const [customers, setCustomers] = useState<any[]>([]);
  const [shops, setShops] = useState<any[]>([]);
  const [ambassadors, setAmbassadors] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(false);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await api.getAdminStats();
        setAdminStats(data);
      } catch (error) {
        console.error("Failed to load admin stats", error);
        toast.error("Failed to load admin dashboard data");
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, []);

  // Fetch tabular data based on active tab
  useEffect(() => {
    const loadTabData = async () => {
      if (activeTab === "overview") return;
      setDataLoading(true);
      try {
        if (activeTab === "customers") {
          const data = await api.getAdminCustomers();
          setCustomers(data);
        } else if (activeTab === "shops") {
          const data = await api.getAdminShops();
          setShops(data);
        } else if (activeTab === "ambassadors") {
          const data = await api.getAdminAmbassadors();
          setAmbassadors(data);
        }
      } catch (error) {
        console.error(`Failed to load ${activeTab}`, error);
        toast.error(`Failed to load ${activeTab} data`);
      } finally {
        setDataLoading(false);
      }
    };
    loadTabData();
  }, [activeTab]);

  const stats = [
    {
      title: "Total Users",
      value: adminStats.total_users.toLocaleString(),
      change: "+12.5%", // Mock change
      icon: Users,
      color: "from-[#1E40AF] to-[#1e3a8a]",
    },
    {
      title: "Active Shops",
      value: adminStats.total_shops.toLocaleString(),
      change: "+8.2%", // Mock change
      icon: Store,
      color: "from-[#065F46] to-[#064e3b]",
    },
    {
      title: "Orders Placed",
      value: adminStats.total_orders.toLocaleString(),
      change: "+15.3%", // Mock change
      icon: Package,
      color: "from-purple-600 to-purple-800",
    },
    {
      title: "Total Volume",
      value: `$${adminStats.total_volume.toLocaleString()}`,
      change: "+5.1%", // Mock change
      icon: TrendingUp,
      color: "from-[#DC2626] to-[#991B1B]",
    },
  ];

  const activityData = [
    { name: "Mon", users: 420, shops: 35, transactions: 89 },
    { name: "Tue", users: 380, shops: 42, transactions: 95 },
    { name: "Wed", users: 510, shops: 38, transactions: 102 },
    { name: "Thu", users: 445, shops: 45, transactions: 88 },
    { name: "Fri", users: 590, shops: 52, transactions: 115 },
    { name: "Sat", users: 680, shops: 48, transactions: 132 },
    { name: "Sun", users: 550, shops: 40, transactions: 98 },
  ];

  const cities = ["Harare", "Bulawayo", "Chitungwiza", "Mutare", "Kwekwe"];

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-lg font-bold text-slate-900 mb-2">Admin Command Center</h1>
          <p className="text-slate-500">Monitor and manage the LocalConnect ecosystem</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex overflow-x-auto hide-scrollbar space-x-2 mb-8 bg-white p-2 rounded-2xl shadow-sm border border-slate-200">
          {(["overview", "customers", "shops", "ambassadors"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 rounded-xl font-medium text-sm transition-all whitespace-nowrap capitalize ${activeTab === tab
                  ? "bg-blue-50 text-blue-600 shadow-sm"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* --- OVERVIEW TAB --- */}
        {activeTab === "overview" && (
          <>
            {/* Stats Grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {stats.map((stat) => {
                const Icon = stat.icon;
                return (
                  <div
                    key={stat.title}
                    className="bg-white rounded-[32px] p-6 shadow-lg border border-slate-200"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-[16px] flex items-center justify-center`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded-[12px] text-sm font-medium">
                        {stat.change}
                      </span>
                    </div>
                    <h3 className="text-slate-500 text-sm mb-1">{stat.title}</h3>
                    <p className="text-lg font-bold text-slate-900">
                      {loading ? "..." : stat.value}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Activity Chart */}
            <div className="bg-white rounded-[32px] p-6 shadow-lg border border-slate-200 mb-8">
              <div className="flex items-center space-x-2 mb-6">
                <TrendingUp className="w-6 h-6 text-blue-600" />
                <h2 className="text-lg font-bold text-slate-900">Weekly Activity</h2>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={activityData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="name" stroke="#64748B" />
                  <YAxis stroke="#64748B" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #E2E8F0",
                      borderRadius: "16px",
                      padding: "12px",
                    }}
                  />
                  <Legend />
                  <Bar dataKey="users" fill="#1E40AF" radius={[8, 8, 0, 0]} name="Users" />
                  <Bar dataKey="shops" fill="#065F46" radius={[8, 8, 0, 0]} name="Shops" />
                  <Bar dataKey="transactions" fill="#7C3AED" radius={[8, 8, 0, 0]} name="Transactions" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Search Desert Heatmap */}
            <div className="bg-white rounded-[32px] p-6 shadow-lg border border-slate-200">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 mb-1">Demand Heatmap</h2>
                  <p className="text-sm text-slate-500">Real-time geospatial breakdown of order volumes</p>
                </div>
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-[20px] focus:outline-none focus:border-[#1E40AF] transition-colors"
                >
                  {cities.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </div>
              <DemandHeatmap />
            </div>
          </>
        )}

        {/* --- CUSTOMERS TAB --- */}
        {activeTab === "customers" && (
          <div className="bg-white rounded-[32px] shadow-lg border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center space-x-3">
              <Users className="w-6 h-6 text-blue-600" />
              <h2 className="text-lg font-bold text-slate-900">Registered Customers</h2>
            </div>
            {dataLoading ? (
              <div className="p-12 text-center text-slate-500">Loading customers...</div>
            ) : customers.length === 0 ? (
              <div className="p-12 text-center text-slate-500">No customers found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="px-6 py-4 text-sm font-semibold text-slate-600">Name</th>
                      <th className="px-6 py-4 text-sm font-semibold text-slate-600">Contact</th>
                      <th className="px-6 py-4 text-sm font-semibold text-slate-600">Location</th>
                      <th className="px-6 py-4 text-sm font-semibold text-slate-600">Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.map((c) => (
                      <tr key={c.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-medium text-slate-900">{c.name}</div>
                          <div className="text-xs text-blue-600 uppercase tracking-wider font-semibold mt-1">Customer</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center text-slate-600 text-sm mb-1">
                            <Mail className="w-4 h-4 mr-2" /> {c.email}
                          </div>
                          {c.phone && (
                            <div className="flex items-center text-slate-500 text-sm">
                              <Phone className="w-4 h-4 mr-2" /> {c.phone}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center text-slate-700 text-sm">
                            <MapPin className="w-4 h-4 text-rose-500 mr-2" />
                            {c.location || "Not Set"}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center text-slate-500 text-sm">
                            <Calendar className="w-4 h-4 mr-2" />
                            {new Date(c.created_at).toLocaleDateString()}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* --- SHOPS TAB --- */}
        {activeTab === "shops" && (
          <div className="bg-white rounded-[32px] shadow-lg border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center space-x-3">
              <Store className="w-6 h-6 text-emerald-600" />
              <h2 className="text-lg font-bold text-slate-900">Verified Shops</h2>
            </div>
            {dataLoading ? (
              <div className="p-12 text-center text-slate-500">Loading shops...</div>
            ) : shops.length === 0 ? (
              <div className="p-12 text-center text-slate-500">No shops found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="px-6 py-4 text-sm font-semibold text-slate-600">Shop Name</th>
                      <th className="px-6 py-4 text-sm font-semibold text-slate-600">Location</th>
                      <th className="px-6 py-4 text-sm font-semibold text-slate-600">Delivery</th>
                      <th className="px-6 py-4 text-sm font-semibold text-slate-600">Rating</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shops.map((s) => (
                      <tr key={s.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-medium text-slate-900">{s.name}</div>
                          {s.phone && <div className="text-sm text-slate-500 mt-1">{s.phone}</div>}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center text-slate-700 text-sm">
                            <MapPin className="w-4 h-4 text-rose-500 mr-2" />
                            {s.location}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {s.offers_delivery ? (
                            <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
                              Offers Delivery (${s.delivery_fee.toFixed(2)})
                            </span>
                          ) : (
                            <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-medium">Pickup Only</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center text-amber-500 text-sm font-medium">
                            ★ {s.rating?.toFixed(1) || "New"}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* --- AMBASSADORS TAB --- */}
        {activeTab === "ambassadors" && (
          <div className="bg-white rounded-[32px] shadow-lg border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center space-x-3">
              <ShieldCheck className="w-6 h-6 text-purple-600" />
              <h2 className="text-lg font-bold text-slate-900">Local Ambassadors</h2>
            </div>
            {dataLoading ? (
              <div className="p-12 text-center text-slate-500">Loading ambassadors...</div>
            ) : ambassadors.length === 0 ? (
              <div className="p-12 text-center text-slate-500">No ambassadors found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="px-6 py-4 text-sm font-semibold text-slate-600">Name</th>
                      <th className="px-6 py-4 text-sm font-semibold text-slate-600">Contact</th>
                      <th className="px-6 py-4 text-sm font-semibold text-slate-600">Assigned Zone</th>
                      <th className="px-6 py-4 text-sm font-semibold text-slate-600">Credits</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ambassadors.map((a) => (
                      <tr key={a.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-medium text-slate-900">{a.name}</div>
                          <div className="text-xs text-purple-600 uppercase tracking-wider font-semibold mt-1">Ambassador</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center text-slate-600 text-sm mb-1">
                            <Mail className="w-4 h-4 mr-2" /> {a.email}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center text-slate-700 text-sm">
                            <MapPin className="w-4 h-4 text-rose-500 mr-2" />
                            {a.location || "Not Assigned"}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-emerald-600">{a.credits} PTS</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
