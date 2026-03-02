import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send, Star, User, Store, MessageCircle } from 'lucide-react';
import { api } from '../../../services/api';
import { toast } from 'sonner';

interface ShopInteractionModalProps {
    isOpen: boolean;
    onClose: () => void;
    shopName: string;
    shopId: number;
    initialTab?: 'chat' | 'reviews';
}

interface Message {
    id: number;
    sender_id: number;
    content: string;
    created_at: string;
    isMine?: boolean;
}

interface Review {
    id: number;
    customer_id: number;
    rating: number;
    comment: string;
    created_at: string;
}

export default function ShopInteractionModal({ isOpen, onClose, shopName, shopId, initialTab = 'chat' }: ShopInteractionModalProps) {
    const [activeTab, setActiveTab] = useState<'chat' | 'reviews'>(initialTab);

    // Chat state
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isChatLoading, setIsChatLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const wsRef = useRef<WebSocket | null>(null);

    // Reviews state
    const [reviews, setReviews] = useState<Review[]>([]);
    const [isReviewsLoading, setIsReviewsLoading] = useState(false);
    const [newReviewRating, setNewReviewRating] = useState(5);
    const [newReviewComment, setNewReviewComment] = useState('');
    const [isSubmittingReview, setIsSubmittingReview] = useState(false);

    const currentUserId = parseInt(localStorage.getItem('userId') || '0', 10);

    // Fetch initial data based on active tab
    useEffect(() => {
        if (isOpen) {
            if (activeTab === 'chat') {
                loadChatHistory();
                setupWebSocket();
            } else {
                loadReviews();
            }
        }
        return () => {
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, [isOpen, activeTab, shopId]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (activeTab === 'chat') {
            scrollToBottom();
        }
    }, [messages, activeTab]);

    const loadChatHistory = async () => {
        setIsChatLoading(true);
        try {
            const history = await api.getChatHistory(shopId);
            setMessages(history.map((m: any) => ({ ...m, isMine: m.sender_id === currentUserId })));
        } catch (e) {
            console.error('Failed to load chat history', e);
        } finally {
            setIsChatLoading(false);
        }
    };

    const setupWebSocket = () => {
        if (wsRef.current) wsRef.current.close();

        // In a real app, use the actual backend URL protocol (ws:// or wss://)
        const wsUrl = `ws://localhost:8000/api/chat/ws/${shopId}`;
        const ws = new WebSocket(wsUrl);

        ws.onmessage = (event) => {
            const message = JSON.parse(event.data);
            setMessages(prev => [...prev, { ...message, isMine: message.sender_id === currentUserId }]);
        };

        wsRef.current = ws;
    };

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !wsRef.current) return;

        const payload = {
            sender_id: currentUserId,
            content: newMessage.trim()
        };

        wsRef.current.send(JSON.stringify(payload));
        setNewMessage('');
    };

    const loadReviews = async () => {
        setIsReviewsLoading(true);
        try {
            const data = await api.getShopReviews(shopId);
            setReviews(data);
        } catch (e) {
            console.error('Failed to load reviews', e);
        } finally {
            setIsReviewsLoading(false);
        }
    };

    const handleSubmitReview = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newReviewComment.trim()) {
            toast.error('Please enter a review comment');
            return;
        }

        setIsSubmittingReview(true);
        try {
            const newReview = await api.submitReview({
                shop_id: shopId,
                rating: newReviewRating,
                comment: newReviewComment.trim()
            });
            setReviews(prev => [newReview, ...prev]);
            setNewReviewComment('');
            setNewReviewRating(5);
            toast.success('Review submitted successfully!');
        } catch (e: any) {
            toast.error(e.message || 'Failed to submit review');
        } finally {
            setIsSubmittingReview(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4"
            >
                <motion.div
                    initial={{ y: '100%' }}
                    animate={{ y: 0 }}
                    exit={{ y: '100%' }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className="bg-white w-full sm:max-w-lg sm:rounded-[32px] rounded-t-[32px] overflow-hidden shadow-2xl flex flex-col h-[85vh] sm:h-[600px]"
                >
                    {/* Header */}
                    <div className="bg-gradient-to-r from-[#1E40AF] to-[#065F46] p-6 text-white flex items-center justify-between shrink-0">
                        <div>
                            <h2 className="text-xl font-bold flex items-center space-x-2">
                                <Store className="w-5 h-5" />
                                <span>{shopName}</span>
                            </h2>
                            <p className="text-sm opacity-80">LocalConnect Secure Communication</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/20 rounded-full transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex border-b border-[#E2E8F0] shrink-0">
                        <button
                            onClick={() => setActiveTab('chat')}
                            className={`flex-1 flex items-center justify-center space-x-2 py-4 font-bold transition-colors ${activeTab === 'chat' ? 'text-[#1E40AF] border-b-2 border-[#1E40AF]' : 'text-[#64748B] hover:bg-[#F8FAFC]'
                                }`}
                        >
                            <MessageCircle className="w-4 h-4" />
                            <span>Live Chat</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('reviews')}
                            className={`flex-1 flex items-center justify-center space-x-2 py-4 font-bold transition-colors ${activeTab === 'reviews' ? 'text-[#065F46] border-b-2 border-[#065F46]' : 'text-[#64748B] hover:bg-[#F8FAFC]'
                                }`}
                        >
                            <Star className="w-4 h-4" />
                            <span>Reviews</span>
                        </button>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 overflow-y-auto bg-[#F8FAFC] relative">
                        {activeTab === 'chat' ? (
                            <div className="p-4 space-y-4">
                                {isChatLoading ? (
                                    <div className="text-center text-[#64748B] py-8">Loading history...</div>
                                ) : messages.length === 0 ? (
                                    <div className="text-center text-[#64748B] py-8">
                                        <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                        <p>Start a conversation with {shopName}</p>
                                    </div>
                                ) : (
                                    messages.map((msg, idx) => (
                                        <div key={idx} className={`flex ${msg.isMine ? 'justify-end' : 'justify-start'}`}>
                                            <div
                                                className={`max-w-[80%] rounded-[20px] px-4 py-3 ${msg.isMine
                                                    ? 'bg-[#1E40AF] text-white rounded-tr-none'
                                                    : 'bg-white text-[#0F172A] border border-[#E2E8F0] rounded-tl-none'
                                                    }`}
                                            >
                                                <p>{msg.content}</p>
                                                <span className={`text-[10px] block mt-1 ${msg.isMine ? 'text-white/70 text-right' : 'text-[#64748B]'}`}>
                                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                )}
                                <div ref={messagesEndRef} />
                            </div>
                        ) : (
                            <div className="p-6">
                                {/* Write Review Form */}
                                <div className="bg-white rounded-[24px] p-5 shadow-sm border border-[#E2E8F0] mb-6">
                                    <h3 className="font-bold text-[#0F172A] mb-3">Write a Review</h3>
                                    <form onSubmit={handleSubmitReview}>
                                        <div className="flex space-x-1 mb-3">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <button
                                                    key={star}
                                                    type="button"
                                                    onClick={() => setNewReviewRating(star)}
                                                    className="focus:outline-none"
                                                >
                                                    <Star
                                                        className={`w-6 h-6 ${star <= newReviewRating ? 'text-[#F59E0B] fill-[#F59E0B]' : 'text-[#CBD5E1]'
                                                            } transition-colors`}
                                                    />
                                                </button>
                                            ))}
                                        </div>
                                        <textarea
                                            value={newReviewComment}
                                            onChange={(e) => setNewReviewComment(e.target.value)}
                                            placeholder="Share your experience..."
                                            className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-[16px] p-3 text-sm focus:outline-none focus:border-[#065F46] resize-none h-24 mb-3"
                                        />
                                        <button
                                            type="submit"
                                            disabled={isSubmittingReview}
                                            className="w-full bg-gradient-to-r from-[#10B981] to-[#065F46] text-white py-3 rounded-[16px] font-bold disabled:opacity-50"
                                        >
                                            {isSubmittingReview ? 'Submitting...' : 'Submit Review'}
                                        </button>
                                    </form>
                                </div>

                                {/* Reviews List */}
                                <div className="space-y-4">
                                    <h3 className="font-bold text-[#0F172A]">Community Reviews</h3>
                                    {isReviewsLoading ? (
                                        <div className="text-center text-[#64748B] py-4">Loading reviews...</div>
                                    ) : reviews.length === 0 ? (
                                        <div className="text-center text-[#64748B] py-8">No reviews yet for this shop.</div>
                                    ) : (
                                        reviews.map((review) => (
                                            <div key={review.id} className="bg-white p-4 rounded-[20px] shadow-sm border border-[#E2E8F0]">
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center space-x-2">
                                                        <div className="w-8 h-8 bg-[#E2E8F0] rounded-full flex items-center justify-center">
                                                            <User className="w-4 h-4 text-[#64748B]" />
                                                        </div>
                                                        <span className="font-bold text-sm text-[#0F172A]">Customer #{review.customer_id}</span>
                                                    </div>
                                                    <div className="flex">
                                                        {[...Array(5)].map((_, i) => (
                                                            <Star
                                                                key={i}
                                                                className={`w-3.5 h-3.5 ${i < review.rating ? 'text-[#F59E0B] fill-[#F59E0B]' : 'text-[#CBD5E1]'
                                                                    }`}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                                <p className="text-[#334155] text-sm">{review.comment}</p>
                                                <span className="text-xs text-[#94A3B8] mt-2 block">
                                                    {new Date(review.created_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Chat Input */}
                    {activeTab === 'chat' && (
                        <div className="p-4 bg-white border-t border-[#E2E8F0] shrink-0">
                            <form onSubmit={handleSendMessage} className="flex space-x-2">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Type your message..."
                                    className="flex-1 bg-[#F8FAFC] border border-[#E2E8F0] rounded-full px-5 py-3 focus:outline-none focus:border-[#1E40AF]"
                                />
                                <button
                                    type="submit"
                                    disabled={!newMessage.trim()}
                                    className="w-12 h-12 bg-gradient-to-br from-[#1E40AF] to-[#065F46] rounded-full flex items-center justify-center text-white disabled:opacity-50 transition-colors"
                                >
                                    <Send className="w-5 h-5 -ml-1" />
                                </button>
                            </form>
                        </div>
                    )}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
