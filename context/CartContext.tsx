"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type CartItem = {
  productId: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  slug: string;
  selectedColor?: string;
  selectedSize?: string;
};

type CartContextValue = {
  items: CartItem[];
  totalPrice: number;
  totalItems: number;
  addToCart: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  mergeWithDB: (dbItems: CartItem[]) => void;
};

const CART_STORAGE_KEY = "nexora-cart";

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw) as CartItem[];
      setItems(Array.isArray(parsed) ? parsed : []);
    } catch {
      setItems([]);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addToCart = useCallback((item: Omit<CartItem, "quantity">, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find(
        (cartItem) =>
          cartItem.productId === item.productId &&
          cartItem.selectedColor === item.selectedColor &&
          cartItem.selectedSize === item.selectedSize
      );
      if (!existing) {
        return [...prev, { ...item, quantity }];
      }

      return prev.map((cartItem) =>
        cartItem.productId === item.productId &&
        cartItem.selectedColor === item.selectedColor &&
        cartItem.selectedSize === item.selectedSize
          ? { ...cartItem, quantity: cartItem.quantity + quantity }
          : cartItem
      );
    });
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setItems((prev) => prev.filter((item) => item.productId !== productId));
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((item) => item.productId !== productId));
      return;
    }

    setItems((prev) =>
      prev.map((item) => (item.productId === productId ? { ...item, quantity } : item))
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const mergeWithDB = useCallback((dbItems: CartItem[]) => {
    setItems((prev) => {
      if (prev.length === 0) return dbItems;
      const localKeys = new Set(
        prev.map((i) => `${i.productId}-${i.selectedColor ?? ""}-${i.selectedSize ?? ""}`)
      );
      const dbOnly = dbItems.filter(
        (i) => !localKeys.has(`${i.productId}-${i.selectedColor ?? ""}-${i.selectedSize ?? ""}`)
      );
      return [...prev, ...dbOnly];
    });
  }, []);

  const totalItems = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  );
  const totalPrice = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items]
  );

  const value = useMemo(
    () => ({
      items,
      totalPrice,
      totalItems,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      mergeWithDB,
    }),
    [addToCart, clearCart, items, mergeWithDB, removeFromCart, totalItems, totalPrice, updateQuantity]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider.");
  }
  return context;
}
