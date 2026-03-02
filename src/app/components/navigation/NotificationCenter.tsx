import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Bell, Check, CheckCheck, Trash2, Info, CheckCircle, AlertTriangle, XCircle } from "lucide-react";
import { useNotifications, Notification } from "../../contexts/NotificationContext";

const typeIcons: Record<string, { icon: any; color: string; bg: string }> = {
    info: { icon: Info, color: "text-blue-600", bg: "bg-blue-50" },
    success: { icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50" },
    warning: { icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-50" },
    error: { icon: XCircle, color: "text-red-600", bg: "bg-red-50" },
};

export default function NotificationCenter() {
    const [open, setOpen] = useState(false);
    const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll } = useNotifications();

    return (
        <div className="relative">
            {/* Bell Icon */}
            <button
                onClick={() => setOpen(!open)}
                className="relative p-2 rounded-xl hover:bg-slate-100 transition-colors"
            >
                <Bell className="w-5 h-5 text-slate-600" />
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                        {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            <AnimatePresence>
                {open && (
                    <>
                        <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
                        <motion.div
                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            transition={{ duration: 0.15 }}
                            className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 overflow-hidden"
                        >
                            {/* Header */}
                            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                                <h3 className="font-bold text-slate-900">Notifications</h3>
                                <div className="flex items-center space-x-2">
                                    {unreadCount > 0 && (
                                        <button
                                            onClick={markAllAsRead}
                                            className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center space-x-1"
                                        >
                                            <CheckCheck className="w-3.5 h-3.5" />
                                            <span>Mark all read</span>
                                        </button>
                                    )}
                                    {notifications.length > 0 && (
                                        <button
                                            onClick={clearAll}
                                            className="text-xs text-slate-400 hover:text-red-500 transition-colors"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Notification List */}
                            <div className="max-h-80 overflow-y-auto">
                                {notifications.length === 0 ? (
                                    <div className="py-10 text-center">
                                        <Bell className="w-10 h-10 text-slate-200 mx-auto mb-2" />
                                        <p className="text-sm text-slate-400">No notifications</p>
                                    </div>
                                ) : (
                                    notifications.map((notif) => {
                                        const typeConfig = typeIcons[notif.type] || typeIcons.info;
                                        const Icon = typeConfig.icon;
                                        const timeAgo = getTimeAgo(notif.createdAt);

                                        return (
                                            <button
                                                key={notif.id}
                                                onClick={() => markAsRead(notif.id)}
                                                className={`w-full text-left px-5 py-3.5 flex items-start space-x-3 hover:bg-slate-50 transition-colors border-b border-slate-50 ${!notif.read ? "bg-blue-50/50" : ""
                                                    }`}
                                            >
                                                <div className={`w-8 h-8 rounded-lg ${typeConfig.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                                                    <Icon className={`w-4 h-4 ${typeConfig.color}`} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between">
                                                        <p className={`text-sm font-medium ${!notif.read ? "text-slate-900" : "text-slate-600"}`}>
                                                            {notif.title}
                                                        </p>
                                                        {!notif.read && (
                                                            <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 ml-2" />
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-slate-400 mt-0.5 truncate">{notif.message}</p>
                                                    <p className="text-[10px] text-slate-300 mt-1">{timeAgo}</p>
                                                </div>
                                            </button>
                                        );
                                    })
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}

function getTimeAgo(date: Date): string {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return "Just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
}
