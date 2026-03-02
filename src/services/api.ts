export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

let _isRefreshing = false;
let _refreshQueue: Array<{ resolve: (v: any) => void; reject: (e: any) => void }> = [];

export const api = {
    // ─── Token helpers ───────────────────────────────────────────────────
    setAuthToken(token: string) {
        if (token) localStorage.setItem("token", token);
        else localStorage.removeItem("token");
    },

    getAuthToken() {
        return localStorage.getItem("token");
    },

    setRefreshToken(token: string) {
        if (token) localStorage.setItem("refreshToken", token);
        else localStorage.removeItem("refreshToken");
    },

    getRefreshToken() {
        return localStorage.getItem("refreshToken");
    },

    // ─── Core fetch with auto-refresh ───────────────────────────────────
    async fetchWithAuth(url: string, options: any = {}): Promise<any> {
        const token = this.getAuthToken();
        const headers: Record<string, string> = {
            ...options.headers,
            "Content-Type": "application/json",
        };
        if (token) headers["Authorization"] = `Bearer ${token}`;

        let response = await fetch(url, { ...options, headers });

        // Auto-refresh on 401
        if (response.status === 401 && this.getRefreshToken()) {
            const newToken = await this._refreshAccessToken();
            if (newToken) {
                headers["Authorization"] = `Bearer ${newToken}`;
                response = await fetch(url, { ...options, headers });
            }
        }

        if (!response.ok) {
            let errorMsg = `Request failed`;
            try {
                const error = await response.json();
                errorMsg = error.detail || errorMsg;
            } catch { }
            throw new Error(errorMsg);
        }
        return response.json();
    },

    async _refreshAccessToken(): Promise<string | null> {
        if (_isRefreshing) {
            return new Promise((resolve, reject) => {
                _refreshQueue.push({ resolve, reject });
            });
        }
        _isRefreshing = true;
        try {
            const res = await fetch(`${API_URL}/auth/refresh`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ refresh_token: this.getRefreshToken() }),
            });
            if (!res.ok) {
                this.setAuthToken("");
                this.setRefreshToken("");
                _refreshQueue.forEach((p) => p.reject(new Error("Refresh failed")));
                return null;
            }
            const data = await res.json();
            this.setAuthToken(data.access_token);
            this.setRefreshToken(data.refresh_token);
            _refreshQueue.forEach((p) => p.resolve(data.access_token));
            return data.access_token;
        } finally {
            _isRefreshing = false;
            _refreshQueue = [];
        }
    },

    // Auth
    async login(formData: FormData) {
        const response = await fetch(`${API_URL}/auth/token`, {
            method: "POST",
            body: formData,
        });
        if (!response.ok) throw new Error("Login failed");
        const data = await response.json();
        // Store both tokens
        if (data.refresh_token) this.setRefreshToken(data.refresh_token);
        return data;
    },

    async register(userData: any) {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(userData),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || "Registration failed");
        }
        return response.json();
    },

    async getCurrentUser() {
        return this.fetchWithAuth(`${API_URL}/auth/me`);
    },

    async getProfile() {
        return this.fetchWithAuth(`${API_URL}/auth/me`);
    },

    async updateProfile(updates: any) {
        return this.fetchWithAuth(`${API_URL}/auth/me`, {
            method: "PUT",
            body: JSON.stringify(updates),
        });
    },

    // Products (supports pagination)
    async getProducts(filters?: {
        search?: string; category?: string;
        min_price?: number; max_price?: number;
        sort_by?: string; shop_id?: number;
        lat?: number; lng?: number;
        page?: number; page_size?: number;
    }) {
        const params = new URLSearchParams();
        if (filters?.search) params.append("search", filters.search);
        if (filters?.category) params.append("category", filters.category);
        if (filters?.min_price !== undefined) params.append("min_price", filters.min_price.toString());
        if (filters?.max_price !== undefined) params.append("max_price", filters.max_price.toString());
        if (filters?.sort_by) params.append("sort_by", filters.sort_by);
        if (filters?.shop_id) params.append("shop_id", filters.shop_id.toString());
        if (filters?.lat !== undefined) params.append("lat", filters.lat.toString());
        if (filters?.lng !== undefined) params.append("lng", filters.lng.toString());
        if (filters?.page) params.append("page", filters.page.toString());
        if (filters?.page_size) params.append("page_size", filters.page_size.toString());

        const response = await fetch(`${API_URL}/products/${params.toString() ? '?' + params.toString() : ''}`);
        if (!response.ok) throw new Error("Failed to fetch products");
        const json = await response.json();
        // Support both paginated { data, total, ... } and flat array responses
        const items = Array.isArray(json) ? json : (json.data || []);
        const products = items.map((item: any) => ({
            id: item.id.toString(),
            name: item.name,
            price: item.price,
            category: item.category,
            shop: item.shop?.name || "Unknown Shop",
            shopId: item.shop?.id || 0,
            shopLat: item.shop?.latitude,
            shopLng: item.shop?.longitude,
            distance: item.distance_str || "Nearby",
            rating: item.shop?.rating || 0,
            imageUrl: item.image_url,
            inStock: (item.stock ?? 0) > 0,
            shopPhone: item.shop?.phone,
            shopLocation: item.shop?.location,
            description: item.description || "",
            stock: item.stock ?? 0,
        }));
        return {
            products,
            total: json.total ?? products.length,
            page: json.page ?? 1,
            pageSize: json.page_size ?? products.length,
            totalPages: json.total_pages ?? 1,
        };
    },

    async getCategories() {
        const response = await fetch(`${API_URL}/products/categories`);
        if (!response.ok) return [];
        return response.json();
    },

    async getShops() {
        const response = await fetch(`${API_URL}/shops/`);
        if (!response.ok) throw new Error("Failed to fetch shops");
        return response.json();
    },

    // Cart
    async getCart(userId: number) {
        return this.fetchWithAuth(`${API_URL}/cart/?user_id=${userId}`);
    },

    async addToCart(userId: number, productId: number, quantity: number = 1) {
        return this.fetchWithAuth(`${API_URL}/cart/?user_id=${userId}`, {
            method: "POST",
            body: JSON.stringify({ product_id: productId, quantity }),
        });
    },

    async removeFromCart(userId: number, productId: number) {
        return this.fetchWithAuth(`${API_URL}/cart/${productId}?user_id=${userId}`, {
            method: "DELETE",
        });
    },

    // Orders
    async createOrder(data: { delivery_type?: string, delivery_address?: string, delivery_notes?: string, credits_to_use?: number } = {}) {
        return this.fetchWithAuth(`${API_URL}/orders/`, {
            method: "POST",
            body: JSON.stringify(data)
        });
    },

    async getMyOrders() {
        return this.fetchWithAuth(`${API_URL}/orders/my-orders`);
    },

    async getShopOrders() {
        return this.fetchWithAuth(`${API_URL}/orders/shop-orders`);
    },

    async updateDeliveryStatus(orderId: number, status: string) {
        return this.fetchWithAuth(`${API_URL}/orders/${orderId}/delivery`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ status })
        });
    },

    // Shop Owner
    async getAllShops() {
        const response = await fetch(`${API_URL}/shops`);
        if (!response.ok) throw new Error("Failed to fetch shops");
        return response.json();
    },

    async getMyShop() {
        return this.fetchWithAuth(`${API_URL}/shop-owner/my-shop`);
    },

    async getShopProductsManaged() {
        return this.fetchWithAuth(`${API_URL}/shop-owner/products`);
    },

    async addShopProduct(product: any) {
        return this.fetchWithAuth(`${API_URL}/shop-owner/products`, {
            method: "POST",
            body: JSON.stringify(product),
        });
    },

    async updateShopProduct(id: number, product: any) {
        return this.fetchWithAuth(`${API_URL}/shop-owner/products/${id}`, {
            method: "PUT",
            body: JSON.stringify(product),
        });
    },

    async deleteShopProduct(id: number) {
        return this.fetchWithAuth(`${API_URL}/shop-owner/products/${id}`, {
            method: "DELETE",
        });
    },

    async getShopAnalytics() {
        return this.fetchWithAuth(`${API_URL}/shop-owner/analytics`);
    },

    // Ambassador
    async getAmbassadorStats() {
        return this.fetchWithAuth(`${API_URL}/ambassador/stats`);
    },

    async getZones() {
        return this.fetchWithAuth(`${API_URL}/ambassador/zones`);
    },

    async getUnverifiedShops() {
        return this.fetchWithAuth(`${API_URL}/ambassador/unverified-shops`);
    },

    async verifyShop(shopId: number) {
        return this.fetchWithAuth(`${API_URL}/ambassador/verify-shop/${shopId}`, {
            method: "POST",
        });
    },

    async getVerifiedShops() {
        return this.fetchWithAuth(`${API_URL}/ambassador/verified-shops`);
    },

    async addAmbassadorProduct(shopId: number, product: any) {
        return this.fetchWithAuth(`${API_URL}/ambassador/shops/${shopId}/products`, {
            method: "POST",
            body: JSON.stringify(product),
        });
    },

    // Admin
    async getAdminStats() {
        return this.fetchWithAuth(`${API_URL}/admin/stats`);
    },

    async getAdminHeatmap() {
        return this.fetchWithAuth(`${API_URL}/admin/heatmap`);
    },

    async getAdminCustomers() {
        return this.fetchWithAuth(`${API_URL}/admin/customers`);
    },

    async getAdminShops() {
        return this.fetchWithAuth(`${API_URL}/admin/shops`);
    },

    async getAdminAmbassadors() {
        return this.fetchWithAuth(`${API_URL}/admin/ambassadors`);
    },

    // Image Upload & CV
    async uploadImage(file: File) {
        const formData = new FormData();
        formData.append("file", file);
        const response = await fetch(`${API_URL}/upload`, {
            method: "POST",
            body: formData
        });
        if (!response.ok) throw new Error("Failed to upload image");
        return response.json();
    },

    // ---- AI Agent ----
    async getAIAgentResponse(query: string, location?: string) {
        return this.fetchWithAuth(
            `${API_URL}/ai-agent/query`,
            {
                method: 'POST',
                body: JSON.stringify({ query, location }),
            }
        );
    },


    // ---- Neural Network CV Search ----
    async chatWithAI(query: string, history: { role: string, content: string }[] = []) {
        return this.fetchWithAuth(`${API_URL}/ai/chat`, {
            method: "POST",
            body: JSON.stringify({ query, history })
        });
    },

    async searchByImage(file: File) {
        const token = this.getAuthToken();
        const formData = new FormData();
        formData.append("file", file);
        const headers: any = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;
        const response = await fetch(`${API_URL}/cv/search-by-image?top_k=5`, {
            method: "POST",
            headers,
            body: formData
        });
        if (!response.ok) throw new Error("Failed to search by image");
        return response.json();
    },

    // Payments
    async initiatePaynowPayment(orderId: number, email: string) {
        return this.fetchWithAuth(`${API_URL}/payments/initiate`, {
            method: "POST",
            body: JSON.stringify({ order_id: orderId, email }),
        });
    },

    // Social
    async getChatHistory(shopId: number) {
        return this.fetchWithAuth(`${API_URL}/chat/history/${shopId}`);
    },

    async submitReview(review: any) {
        return this.fetchWithAuth(`${API_URL}/reviews/`, {
            method: "POST",
            body: JSON.stringify(review),
        });
    },

    async getShopReviews(shopId: number) {
        return this.fetchWithAuth(`${API_URL}/reviews/shop/${shopId}`);
    }
};
