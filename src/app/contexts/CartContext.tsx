import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { api } from "../../services/api";

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl: string;
  shop: string;
  shopPhone?: string;
  shopLocation?: string;
  distance: string;
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (item: Omit<CartItem, "quantity">) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  getCartItemsCount: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  // We access userId from localStorage directly to avoid circular dependency with LocationContext
  // or complicated refactoring. Root.tsx sets it.

  const [userId, setUserId] = useState<number | null>(() => {
    const id = localStorage.getItem("userId");
    return id ? parseInt(id) : null;
  });

  // Listen for storage changes in case login happens in another component
  useEffect(() => {
    const handleStorageChange = () => {
      const id = localStorage.getItem("userId");
      setUserId(id ? parseInt(id) : null);
    };

    window.addEventListener("storage", handleStorageChange);
    // Periodically check local storage as a fallback because same-tab localStorage sets 
    // don't always trigger 'storage' events
    const interval = setInterval(handleStorageChange, 1000);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (userId) {
      api.getCart(userId).then((backendItems: any[]) => {
        const mapped: CartItem[] = backendItems.map((bi: any) => ({
          id: String(bi.id),
          productId: String(bi.product_id),
          name: bi.product?.name || "Unknown",
          price: bi.product?.price ?? 0,
          quantity: bi.quantity,
          imageUrl: bi.product?.image_url || "",
          shop: bi.product?.shop?.name || "Unknown Shop",
          shopPhone: bi.product?.shop?.phone || "",
          shopLocation: bi.product?.shop?.location || "",
          distance: "",
        }));
        setCartItems(mapped);
      }).catch(console.error);
    } else {
      setCartItems([]);
    }
  }, [userId]);

  const addToCart = async (item: Omit<CartItem, "quantity">) => {
    if (!userId) {
      // Handle guest cart later or prompt login
      console.warn("User not logged in");
      return;
    }

    // Optimistic update
    setCartItems((prevItems) => {
      const existingItem = prevItems.find((i) => i.productId === item.productId);
      if (existingItem) {
        return prevItems.map((i) =>
          i.productId === item.productId
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      return [...prevItems, { ...item, quantity: 1, id: `temp-${Date.now()}` }];
    });

    try {
      await api.addToCart(userId, parseInt(item.productId));
    } catch (e) {
      console.error("Failed to add to cart backend", e);
    }
  };

  const removeFromCart = async (productId: string) => {
    setCartItems((prevItems) => prevItems.filter((i) => i.productId !== productId));
    try {
      if (userId) await api.removeFromCart(userId, parseInt(productId));
    } catch (e) {
      console.error("Failed to remove from cart backend", e);
    }
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCartItems((prevItems) =>
      prevItems.map((i) =>
        i.productId === productId ? { ...i, quantity } : i
      )
    );
    // Note: Backend doesn't have update quantity endpoint yet, only add (which increments).
    // We might need to add one or call add multiple times (inefficient).
    // For now, local update is fine.
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const getCartItemsCount = () => {
    return cartItems.reduce((count, item) => count + item.quantity, 0);
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getCartTotal,
        getCartItemsCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
