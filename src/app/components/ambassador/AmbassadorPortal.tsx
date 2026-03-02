import { useState, useEffect } from "react";
import { Camera, CheckCircle, Clock, Award, MapPin, TrendingUp, Store, Check, X, PlusCircle } from "lucide-react";
import SnapAndVerify from "./SnapAndVerify";
import AmbassadorAddProduct from "./AmbassadorAddProduct";
import { api } from "../../../services/api";
import { toast } from "sonner";

export default function AmbassadorPortal() {
  const [showSnapVerify, setShowSnapVerify] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>({
    stats: { verified_shops: 0, pending_invites: 0, community_score: 0 },
    zones: []
  });
  const [pendingShops, setPendingShops] = useState<any[]>([]);
  const [verifying, setVerifying] = useState<number | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [statsData, zonesData, shopsData] = await Promise.all([
          api.getAmbassadorStats(),
          api.getZones(),
          api.getUnverifiedShops()
        ]);
        setDashboardData({ stats: statsData, zones: zonesData });
        setPendingShops(shopsData);
      } catch (error) {
        console.error("Failed to load ambassador data", error);
        toast.error("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const stats = [
    {
      title: "Verified Shops",
      value: dashboardData.stats.verified_shops.toString(),
      icon: CheckCircle,
      color: "from-[#10B981] to-[#059669]",
    },
    {
      title: "Pending Reviews",
      value: dashboardData.stats.pending_invites.toString(),
      icon: Clock,
      color: "from-[#F59E0B] to-[#D97706]",
    },
    {
      title: "Points Earned",
      value: dashboardData.stats.community_score.toLocaleString(),
      icon: Award,
      color: "from-purple-600 to-purple-800",
    },
    {
      title: "Assigned Zones",
      value: dashboardData.zones.length.toString(),
      icon: MapPin,
      color: "from-[#1E40AF] to-[#1e3a8a]",
    },
  ];

  const recentActivities = [
    {
      id: "1",
      action: "Verified Fresh Bread",
      shop: "Sunrise Bakery",
      time: "2 hours ago",
      status: "approved",
      points: 10,
    },
    {
      id: "2",
      action: "Verified Organic Rice",
      shop: "Makoni's Groceries",
      time: "5 hours ago",
      status: "approved",
      points: 15,
    },
    {
      id: "3",
      action: "Submitted Tomatoes Photo",
      shop: "Green Valley Farms",
      time: "1 day ago",
      status: "pending",
      points: 12,
    },
  ];

  const assignedZones = dashboardData.zones.length > 0 ? dashboardData.zones : [
    // Fallback or empty state if needed, or just map the zones from API
  ];

  if (showSnapVerify) {
    return <SnapAndVerify onClose={() => setShowSnapVerify(false)} />;
  }

  if (showAddProduct) {
    return <AmbassadorAddProduct onClose={() => setShowAddProduct(false)} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Ambassador Portal</h1>
          <p className="text-slate-500">Verify and support local community shops</p>
        </div>

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
                </div>
                <h3 className="text-slate-500 text-sm mb-1">{stat.title}</h3>
                <p className="text-3xl font-bold text-slate-900">{stat.value}</p>
              </div>
            );
          })}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Action Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Snap & Verify CTA */}
            <div className="bg-gradient-to-br from-blue-600 to-emerald-600 rounded-[32px] p-8 shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">
                    Start Verifying
                  </h2>
                  <p className="text-white/80 mb-6">
                    Photograph and tag products in your assigned zones
                  </p>
                  <button
                    onClick={() => setShowSnapVerify(true)}
                    className="flex items-center space-x-3 px-8 py-4 bg-white text-blue-600 rounded-[24px] hover:bg-white/90 transition-all shadow-lg font-bold"
                  >
                    <Camera className="w-6 h-6" />
                    <span>Snap & Verify</span>
                  </button>
                </div>
                <div className="hidden md:block">
                  <div className="w-32 h-32 bg-white/20 rounded-[32px] flex items-center justify-center">
                    <Camera className="w-16 h-16 text-white" />
                  </div>
                </div>
              </div>
            </div>

            {/* Add Products for Shop CTA */}
            <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-[32px] p-8 shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">
                    Add Shop Items
                  </h2>
                  <p className="text-white/80 mb-6">
                    Help verified shop owners by digitizing their products
                  </p>
                  <button
                    onClick={() => setShowAddProduct(true)}
                    className="flex items-center space-x-3 px-8 py-4 bg-white text-[#7C3AED] rounded-[24px] hover:bg-white/90 transition-all shadow-lg font-bold"
                  >
                    <PlusCircle className="w-6 h-6" />
                    <span>Add New Item</span>
                  </button>
                </div>
                <div className="hidden md:block">
                  <div className="w-32 h-32 bg-white/20 rounded-[32px] flex items-center justify-center">
                    <PlusCircle className="w-16 h-16 text-white" />
                  </div>
                </div>
              </div>
            </div>

            {/* Pending Shops for Verification */}
            {pendingShops.length > 0 && (
              <div className="bg-white rounded-[32px] p-6 shadow-lg border border-slate-200">
                <div className="flex items-center space-x-2 mb-6">
                  <Store className="w-6 h-6 text-amber-500" />
                  <h2 className="text-xl font-bold text-slate-900">Pending Shops ({pendingShops.length})</h2>
                </div>
                <div className="space-y-3">
                  {pendingShops.map((shop: any) => (
                    <div
                      key={shop.id}
                      className="flex items-center justify-between p-4 bg-slate-50 rounded-[20px]"
                    >
                      <div className="flex-1">
                        <h3 className="font-bold text-slate-900">{shop.name}</h3>
                        <p className="text-sm text-slate-500">{shop.location} • Owner: {shop.owner_name}</p>
                        <p className="text-xs text-[#94A3B8] mt-0.5">{shop.phone}</p>
                      </div>
                      <button
                        onClick={async () => {
                          setVerifying(shop.id);
                          try {
                            await api.verifyShop(shop.id);
                            setPendingShops((prev) => prev.filter((s) => s.id !== shop.id));
                            setDashboardData((prev: any) => ({
                              ...prev,
                              stats: {
                                ...prev.stats,
                                verified_shops: prev.stats.verified_shops + 1,
                                pending_invites: prev.stats.pending_invites - 1,
                              },
                            }));
                            toast.success(`${shop.name} verified!`);
                          } catch {
                            toast.error("Failed to verify shop");
                          } finally {
                            setVerifying(null);
                          }
                        }}
                        disabled={verifying === shop.id}
                        className="ml-4 px-5 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors text-sm font-medium disabled:opacity-50 flex items-center space-x-1.5"
                      >
                        {verifying === shop.id ? (
                          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <Check className="w-4 h-4" />
                        )}
                        <span>Verify</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Activities */}
            <div className="bg-white rounded-[32px] p-6 shadow-lg border border-slate-200">
              <div className="flex items-center space-x-2 mb-6">
                <Clock className="w-6 h-6 text-blue-600" />
                <h2 className="text-xl font-bold text-slate-900">Recent Activities</h2>
              </div>
              <div className="space-y-4">
                {recentActivities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center justify-between p-4 bg-slate-50 rounded-[20px] hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex-1">
                      <h3 className="font-bold text-slate-900 mb-1">
                        {activity.action}
                      </h3>
                      <p className="text-sm text-slate-500">{activity.shop}</p>
                      <p className="text-xs text-slate-500 mt-1">{activity.time}</p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-sm font-bold text-[#7C3AED]">
                          +{activity.points} pts
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-[12px] text-xs font-medium ${activity.status === "approved"
                          ? "bg-emerald-500/10 text-emerald-500"
                          : "bg-amber-500/10 text-amber-500"
                          }`}
                      >
                        {activity.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar - Assigned Zones */}
          <div className="space-y-6">
            <div className="bg-white rounded-[32px] p-6 shadow-lg border border-slate-200">
              <div className="flex items-center space-x-2 mb-6">
                <MapPin className="w-6 h-6 text-blue-600" />
                <h2 className="text-xl font-bold text-slate-900">Your Zones</h2>
              </div>
              <div className="space-y-4">
                {assignedZones.length === 0 && !loading ? (
                  <div className="text-center py-8 text-slate-500">
                    <MapPin className="w-12 h-12 mx-auto mb-2 opacity-20" />
                    <p>No zones assigned yet.</p>
                  </div>
                ) : (
                  assignedZones.map((zone: any) => (
                    <div
                      key={zone.id}
                      className="p-4 bg-slate-50 rounded-[20px] hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-bold text-slate-900">{zone.name}</h3>
                        <span
                          className={`px-2 py-1 rounded-[8px] text-xs font-medium ${zone.priority === "high"
                            ? "bg-red-500/10 text-red-500"
                            : zone.priority === "medium"
                              ? "bg-amber-500/10 text-amber-500"
                              : "bg-emerald-500/10 text-emerald-500"
                            }`}
                        >
                          {zone.priority || "medium"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm text-slate-500 mb-3">
                        <span>{zone.shops || 0} shops</span>
                        <span>{zone.coverage || 0}% coverage</span>
                      </div>
                      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-600 to-emerald-600 rounded-full"
                          style={{ width: `${zone.coverage || 0}%` }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Leaderboard Preview */}
            <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-[32px] p-6 shadow-lg text-white">
              <div className="flex items-center space-x-2 mb-4">
                <TrendingUp className="w-6 h-6" />
                <h3 className="text-lg font-bold">Your Rank</h3>
              </div>
              <div className="text-center py-6">
                <p className="text-5xl font-bold mb-2">#7</p>
                <p className="text-white/80">This Month</p>
              </div>
              <button className="w-full py-3 bg-white/20 hover:bg-white/30 rounded-[20px] font-medium transition-colors">
                View Leaderboard
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
