import { useState } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { Shield, Store, Users, Award, Mail, Lock, ArrowRight, ArrowLeft, Check } from "lucide-react";
import { useLocation } from "../Root";
import { api } from "../../../services/api";

type UserRole = "system-admin" | "shop-owner" | "resident" | "ambassador";

export default function AuthScreen() {
  const navigate = useNavigate();
  const { login, location, userCoords } = useLocation();

  // State
  const [step, setStep] = useState<"role" | "auth">("role");
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const roles = [
    {
      id: "resident" as UserRole,
      title: "Customer",
      description: "Discover & shop local",
      icon: Users,
      color: "from-emerald-600 to-emerald-800",
      bg: "bg-emerald-50 text-emerald-900",
    },
    {
      id: "shop-owner" as UserRole,
      title: "Shop Owner",
      description: "Manage inventory & sales",
      icon: Store,
      color: "from-blue-600 to-blue-800",
      bg: "bg-blue-50 text-blue-900",
    }
  ];

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setStep("auth");

    // Pre-fill for demo convenience
    if (role === "resident") setEmail("nyashamukarakate@gmail.com");
    else if (role === "shop-owner") setEmail("owner1@shops.com");
    else setEmail("");
    setPassword("password123");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole || !email || !password) return;

    setLoading(true);
    try {
      if (!isLogin) {
        // Register flow
        await api.register({
          email,
          password,
          name: name || email.split('@')[0],
          role: selectedRole,
          location: location,
          latitude: userCoords ? userCoords[0] : null,
          longitude: userCoords ? userCoords[1] : null
        });
      }

      const formData = new FormData();
      formData.append("username", email);
      formData.append("password", password);

      const data = await api.login(formData);
      login(data.access_token, data.role, data.user_id);

      // Navigate
      switch (data.role) {
        case "shop-owner": navigate("/shop-owner"); break;
        case "system-admin": navigate("/admin"); break;
        case "ambassador": navigate("/ambassador"); break;
        default: navigate("/marketplace");
      }
    } catch (error) {
      console.error("Auth failed", error);
      alert("Authentication failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const selectedRoleData = roles.find(r => r.id === selectedRole);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 font-sans">
      <div className="w-full max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

        {/* Left Side: Illustration / Brand */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="hidden lg:block space-y-8"
        >
          <div className="space-y-4">
            <div className="inline-flex items-center space-x-2 bg-blue-100 text-blue-800 px-4 py-1.5 rounded-full text-sm font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              <span>Local Ecosystem v1.0</span>
            </div>
            {/* Logo */}
            <div className="w-16 h-16 rounded-[16px] flex items-center justify-center shadow-lg shadow-blue-500/20 overflow-hidden bg-white mb-4">
              <img src="/logo.png" alt="LocalConnect Logo" className="w-full h-full object-contain" />
            </div>
            <h1 className="text-5xl font-bold tracking-tight text-slate-900 leading-tight">
              Powering <span className="text-blue-600">Local Commerce</span> Together.
            </h1>
            <p className="text-lg text-slate-600 max-w-md leading-relaxed">
              LocalConnect bridges the gap between residents and local businesses, fostering a thriving community economy.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Community First", desc: "Built for locals" },
              { label: "Secure", desc: "Enterprise grade" },
              { label: "Fast", desc: "Real-time updates" },
              { label: "Scalable", desc: "Grows with you" }
            ].map((item, i) => (
              <div key={i} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="font-semibold text-slate-900">{item.label}</h3>
                <p className="text-sm text-slate-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Right Side: Interactive Card */}
        <div className="w-full max-w-md mx-auto">
          <AnimatePresence mode="wait">
            {step === "role" ? (
              <motion.div
                key="role-selection"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white rounded-[32px] shadow-xl border border-slate-100 overflow-hidden"
              >
                <div className="p-8 pb-4">
                  <h2 className="text-2xl font-bold text-slate-900">Get Started</h2>
                  <p className="text-slate-500 mt-1">Select your role to continue</p>
                </div>

                <div className="px-4 pb-8 space-y-3">
                  {roles.map((role, i) => (
                    <motion.button
                      key={role.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      onClick={() => handleRoleSelect(role.id)}
                      className="w-full flex items-center p-4 rounded-2xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all group text-left"
                    >
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${role.bg} mr-4 group-hover:scale-110 transition-transform`}>
                        <role.icon className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-900">{role.title}</h3>
                        <p className="text-xs text-slate-500">{role.description}</p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-slate-600 group-hover:translate-x-1 transition-all" />
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="auth-form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-[32px] shadow-xl border border-slate-100 overflow-hidden p-8"
              >
                {/* Header with Back Button */}
                <div className="flex items-center mb-8">
                  <button
                    onClick={() => setStep("role")}
                    className="mr-4 p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">
                      {isLogin ? "Welcome Back" : "Create Account"}
                    </h2>
                    <div className="flex items-center text-sm text-slate-500 mt-1">
                      <span className="mr-2">As {selectedRoleData?.title}</span>
                      {selectedRoleData && (
                        <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${selectedRoleData.color}`} />
                      )}
                    </div>
                  </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-5">
                  {!isLogin && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5 ml-1">Full Name</label>
                      <div className="relative group">
                        <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 pl-12 pr-4 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium text-slate-900"
                          placeholder="John Doe"
                          required={!isLogin}
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5 ml-1">Email</label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 pl-12 pr-4 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium text-slate-900"
                        placeholder="you@example.com"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5 ml-1">Password</label>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 pl-12 pr-4 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium text-slate-900"
                        placeholder="••••••••"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className={`w-full py-4 rounded-2xl font-bold text-lg text-white shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all flex items-center justify-center space-x-2
                                    ${loading ? "opacity-70 cursor-not-allowed" : "hover:opacity-90"}
                                    bg-gradient-to-r ${selectedRoleData?.color || "from-blue-600 to-blue-800"}
                                `}
                  >
                    {loading ? (
                      <span className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>{isLogin ? "Sign In" : "Create Account"}</span>
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </form>

                {/* Footer Switch */}
                <div className="mt-8 text-center">
                  <button
                    onClick={() => setIsLogin(!isLogin)}
                    className="text-slate-500 hover:text-slate-800 text-sm font-medium transition-colors"
                  >
                    {isLogin ? (
                      <>New here? <span className="text-blue-600">Create an account</span></>
                    ) : (
                      <>Already a member? <span className="text-blue-600">Sign in</span></>
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}