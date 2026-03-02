import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { User, Mail, Phone, MapPin, Shield, Save, ArrowLeft, Camera, Lock } from "lucide-react";
import { useNavigate } from "react-router";
import { useLocation } from "../Root";
import { api } from "../../../services/api";
import { toast } from "sonner";

interface ProfileData {
    id: number;
    email: string;
    name: string;
    role: string;
    phone: string | null;
    location: string | null;
    created_at: string;
}

const roleBadge: Record<string, { label: string; color: string }> = {
    "resident": { label: "Customer", color: "bg-emerald-100 text-emerald-700" },
    "shop-owner": { label: "Shop Owner", color: "bg-blue-100 text-blue-700" },
    "ambassador": { label: "Ambassador", color: "bg-red-100 text-red-700" },
    "system-admin": { label: "System Admin", color: "bg-purple-100 text-purple-700" },
};

export default function ProfilePage() {
    const navigate = useNavigate();
    const { isAuthenticated } = useLocation();
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Editable fields
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [location, setLocationField] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [showPasswordField, setShowPasswordField] = useState(false);

    useEffect(() => {
        if (!isAuthenticated) {
            navigate("/auth");
            return;
        }
        loadProfile();
    }, [isAuthenticated]);

    const loadProfile = async () => {
        try {
            const data = await api.getProfile();
            setProfile(data);
            setName(data.name || "");
            setPhone(data.phone || "");
            setLocationField(data.location || "");
        } catch (error) {
            toast.error("Failed to load profile");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const updates: any = { name, phone, location };
            if (newPassword) updates.password = newPassword;

            const data = await api.updateProfile(updates);
            setProfile(data);
            setNewPassword("");
            setShowPasswordField(false);
            toast.success("Profile updated successfully!");
        } catch (error) {
            toast.error("Failed to update profile");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
            </div>
        );
    }

    if (!profile) return null;

    const badge = roleBadge[profile.role] || roleBadge["resident"];
    const memberSince = new Date(profile.created_at).toLocaleDateString("en-US", {
        year: "numeric", month: "long", day: "numeric"
    });

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            {/* Header */}
            <div className="bg-gradient-to-br from-blue-600 to-blue-800 px-4 py-12">
                <div className="max-w-2xl mx-auto">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center text-white/80 hover:text-white mb-6 text-sm transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4 mr-1" /> Back
                    </button>
                    <div className="flex items-center space-x-5">
                        <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white text-3xl font-bold">
                            {profile.name?.charAt(0)?.toUpperCase() || "U"}
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white">{profile.name}</h1>
                            <p className="text-white/70 text-sm">{profile.email}</p>
                            <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold ${badge.color}`}>
                                {badge.label}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-2xl mx-auto px-4 -mt-6">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden"
                >
                    {/* Form */}
                    <div className="p-6 space-y-5">
                        <h2 className="text-lg font-bold text-slate-900">Personal Information</h2>

                        {/* Name */}
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1.5 ml-1">Full Name</label>
                            <div className="relative group">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                <input
                                    type="text" value={name} onChange={(e) => setName(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-sm font-medium text-slate-900"
                                />
                            </div>
                        </div>

                        {/* Email (read-only) */}
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1.5 ml-1">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="email" value={profile.email} readOnly
                                    className="w-full bg-slate-100 border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-sm text-slate-500 cursor-not-allowed"
                                />
                            </div>
                        </div>

                        {/* Phone */}
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1.5 ml-1">Phone</label>
                            <div className="relative group">
                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                <input
                                    type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                                    placeholder="Add phone number"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-sm font-medium text-slate-900"
                                />
                            </div>
                        </div>

                        {/* Location */}
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1.5 ml-1">Location</label>
                            <div className="relative group">
                                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                <input
                                    type="text" value={location} onChange={(e) => setLocationField(e.target.value)}
                                    placeholder="Add your location"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-sm font-medium text-slate-900"
                                />
                            </div>
                        </div>

                        {/* Password Change */}
                        <div className="pt-2 border-t border-slate-100">
                            {!showPasswordField ? (
                                <button
                                    onClick={() => setShowPasswordField(true)}
                                    className="flex items-center text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
                                >
                                    <Lock className="w-4 h-4 mr-2" /> Change Password
                                </button>
                            ) : (
                                <div>
                                    <label className="block text-sm font-medium text-slate-600 mb-1.5 ml-1">New Password</label>
                                    <div className="relative group">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                        <input
                                            type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                                            placeholder="Enter new password"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-sm font-medium text-slate-900"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                        <p className="text-xs text-slate-400">Member since {memberSince}</p>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex items-center space-x-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 active:scale-[0.98] transition-all font-medium text-sm disabled:opacity-50"
                        >
                            {saving ? (
                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <Save className="w-4 h-4" />
                            )}
                            <span>{saving ? "Saving..." : "Save Changes"}</span>
                        </button>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
