import React, { useState } from "react";
import { Bot, X, Mic, Camera, Send, MessageCircle, MapPin, Phone, ExternalLink, Star, ImagePlus } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useLocation } from "../Root";
import { api } from "../../../services/api";
import ARViewMode from "./ARViewMode";
import MapView from "../map/MapView";

export default function FloatingAIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [showARView, setShowARView] = useState(false);
  const [message, setMessage] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const { userRole, userCoords, location } = useLocation();

  const [messages, setMessages] = useState<Array<{ role: string; content?: string; stores?: any[]; products?: any[]; map_view?: boolean }>>([
    {
      role: "assistant",
      content: "👋 Hi! I'm your LocalConnect AI Assistant. How can I help you today?",
    },
  ]);

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    const userMessage = message;
    setMessage("");

    // We append the user message right away so it renders instantly
    const newMessages = [...messages, { role: "user", content: userMessage }];
    setMessages(newMessages);

    // Format history: extract only role and string content for the backend 
    // We skip the very latest userMessage as that is sent as the `query`
    const history = messages
      .filter(m => m.content) // Only messages with text
      .map(m => ({ role: m.role, content: m.content as string }));

    try {
      // Show typing indicator or just wait
      const response = await api.chatWithAI(userMessage, history);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: response.message,
          stores: response.stores || [],
          // Map products if returned
          products: response.products || [],
          map_view: response.map_view,
        },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I'm having trouble connecting to the server right now.Please serve try again later.",
        },
      ]);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset input
    event.target.value = "";

    // Show user message indicating an image upload
    setMessages((prev) => [
      ...prev,
      { role: "user", content: `📷 Uploaded image for visual search...` },
    ]);

    setIsUploading(true);

    try {
      const response = await api.searchByImage(file);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: response.message || "Here are the visually similar products I found:",
          products: response.results || [],
        },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I couldn't perform the image search right now. Please try again.",
        },
      ]);
    } finally {
      setIsUploading(false);
    }
  };

  const handleVoiceInput = () => {
    setIsListening(!isListening);
    // Simulate voice input
    if (!isListening) {
      setTimeout(() => {
        setMessage("Find fresh bread nearby");
        setIsListening(false);
      }, 2000);
    }
  };

  if (showARView) {
    return <ARViewMode onClose={() => setShowARView(false)} />;
  }

  return (
    <>
      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-4 w-96 max-w-[calc(100vw-2rem)] bg-white rounded-[32px] shadow-2xl border border-slate-200 overflow-hidden z-40"
          >
            {/* Header */}
            <div className="bg-gradient-to-br from-blue-600 to-emerald-600 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white rounded-[16px] flex items-center justify-center overflow-hidden">
                    <img src="/logo.png" alt="LocalConnect AI" className="w-8 h-8 object-contain" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white">AI Assistant</h3>
                    <p className="text-xs text-white/80">Always here to help</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-white/20 rounded-[12px] transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="h-80 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"
                    } items-end gap-2`}
                >
                  {msg.role === "user" ? (
                    <>
                      <div className="max-w-[80%] p-4 rounded-[20px] bg-gradient-to-br from-blue-600 to-emerald-600 text-white">
                        <p className="text-sm">{msg.content}</p>
                      </div>
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-emerald-600 rounded-[12px] flex items-center justify-center flex-shrink-0 overflow-hidden shadow-sm">
                        {/* We use the logo for the assistant not user, this is user side, but keeping logo to match visual style if requested, otherwise fallback to user avatar. Actually, user should not have logo.png, reverting to a simple User icon or avatar */}
                        <div className="w-8 h-8 bg-white/20 rounded-[12px] flex items-center justify-center">
                          <span className="text-white text-xs font-bold">U</span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="max-w-full space-y-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-emerald-600 rounded-[12px] flex items-center justify-center flex-shrink-0 overflow-hidden shadow-sm mb-2">
                        <img src="/logo.png" alt="AI" className="w-6 h-6 object-contain" />
                      </div>
                      {msg.content && (
                        <div className="p-4 rounded-[20px] bg-slate-50 text-slate-900 w-fit">
                          <p className="text-sm">{msg.content}</p>
                        </div>
                      )}
                      {msg.stores && msg.stores.length > 0 && (
                        <div className="space-y-3">
                          {msg.stores.map((store) => (
                            <motion.div
                              key={store.id}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              className="bg-white border border-slate-200 rounded-[20px] p-4 hover:shadow-lg transition-all"
                            >
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                  <h4 className="font-bold text-slate-900 mb-1">{store.name}</h4>
                                  <div className="flex items-center space-x-1 text-sm text-amber-500 mb-2">
                                    <Star className="w-3.5 h-3.5 fill-amber-500" />
                                    <span>{store.rating}</span>
                                    <span className="text-slate-500 ml-2">• {store.distance}</span>
                                  </div>
                                </div>
                                <a
                                  href={store.link}
                                  className="p-2 bg-blue-50 hover:bg-blue-100 rounded-[12px] transition-colors"
                                >
                                  <ExternalLink className="w-4 h-4 text-blue-600" />
                                </a>
                              </div>

                              <div className="space-y-2 mb-3">
                                <div className="flex items-center space-x-2 text-xs text-slate-500">
                                  <MapPin className="w-3.5 h-3.5" />
                                  <span>{store.location}</span>
                                </div>
                                <div className="flex items-center space-x-2 text-xs text-slate-500">
                                  <Phone className="w-3.5 h-3.5" />
                                  <span>{store.phone}</span>
                                </div>
                              </div>

                              <div className="flex flex-wrap gap-2">
                                {store.items.slice(0, 3).map((item: string, i: number) => (
                                  <span
                                    key={i}
                                    className="px-3 py-1 bg-blue-50 text-blue-600 rounded-[12px] text-xs font-medium"
                                  >
                                    {item}
                                  </span>
                                ))}
                              </div>
                            </motion.div>
                          ))
                          }
                        </div>
                      )}

                      {/* Map View Integration */}
                      {msg.map_view && msg.stores && msg.stores.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-3"
                        >
                          <MapView
                            userLocation={userCoords}
                            shops={msg.stores.map(s => ({
                              id: s.id,
                              name: s.name,
                              location: s.location,
                              distance: s.distance,
                              latitude: s.latitude,
                              longitude: s.longitude,
                            }))}
                          />
                        </motion.div>
                      )}

                      {/* Render Products if available */}
                      {msg.products && msg.products.length > 0 && (
                        <div className="space-y-3 mt-3">
                          {msg.products.map((product) => (
                            <motion.div
                              key={product.id}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              className="bg-white border border-slate-200 rounded-[20px] p-3 flex gap-3 hover:shadow-md transition-all"
                            >
                              {product.image_url ? (
                                <img src={product.image_url} alt={product.name} className="w-16 h-16 rounded-xl object-cover bg-slate-100" />
                              ) : (
                                <div className="w-16 h-16 rounded-xl bg-slate-100 flex items-center justify-center overflow-hidden">
                                  <img src="/logo.png" alt="Product Placeholder" className="w-10 h-10 object-contain opacity-50" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-slate-900 text-sm truncate">{product.name}</h4>
                                <p className="text-xs text-slate-500 mb-1">{product.shop_name}</p>
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-emerald-600 text-sm">${product.price.toFixed(2)}</span>
                                  <button className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100">
                                    <ExternalLink className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Input Area */}
            <div className="border-t border-slate-200 p-4">
              {/* Quick Actions */}
              <div className="flex space-x-2 mb-3">
                {userRole === "shop-owner" && (
                  <button
                    onClick={handleVoiceInput}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-[16px] text-sm transition-colors ${isListening
                      ? "bg-red-500 text-white"
                      : "bg-slate-100 text-slate-900 hover:bg-slate-200"
                      }`}
                  >
                    <Mic className="w-4 h-4" />
                    <span>{isListening ? "Listening..." : "Voice"}</span>
                  </button>
                )}
                <button
                  onClick={() => setShowARView(true)}
                  className="flex items-center space-x-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-[16px] text-sm transition-colors"
                >
                  <Camera className="w-4 h-4" />
                  <span>AR View</span>
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageUpload}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="flex items-center space-x-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-[16px] text-sm transition-colors disabled:opacity-50"
                >
                  <ImagePlus className="w-4 h-4" />
                  <span>{isUploading ? "Uploading..." : "Visual Search"}</span>
                </button>
              </div>

              {/* Text Input */}
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                  placeholder="Ask me anything..."
                  className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-[20px] focus:outline-none focus:border-blue-600 transition-colors"
                />
                <button
                  onClick={handleSendMessage}
                  className="p-3 bg-gradient-to-br from-blue-600 to-emerald-600 text-white rounded-[20px] hover:opacity-90 transition-opacity"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div >
        )
        }
      </AnimatePresence >

      {/* Floating Button */}
      < motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-br from-blue-600 to-emerald-600 text-white rounded-full shadow-2xl hover:shadow-3xl transition-shadow flex items-center justify-center z-50"
      >
        {
          isOpen ? (
            <X className="w-7 h-7" />
          ) : (
            <MessageCircle className="w-7 h-7" />
          )}
      </motion.button >
    </>
  );
}