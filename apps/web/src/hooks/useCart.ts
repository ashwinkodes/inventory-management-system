import { useState, useCallback } from "react";

export interface CartItem {
  gearId: string;
  name: string;
  category: string;
  quantity: number;
  maxQuantity: number;
}

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem = useCallback((item: Omit<CartItem, "quantity">) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.gearId === item.gearId);
      if (existing) {
        if (existing.quantity >= item.maxQuantity) return prev;
        return prev.map((i) =>
          i.gearId === item.gearId ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  }, []);

  const removeItem = useCallback((gearId: string) => {
    setItems((prev) => prev.filter((i) => i.gearId !== gearId));
  }, []);

  const updateQuantity = useCallback((gearId: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((i) => i.gearId !== gearId));
      return;
    }
    setItems((prev) =>
      prev.map((i) =>
        i.gearId === gearId
          ? { ...i, quantity: Math.min(quantity, i.maxQuantity) }
          : i
      )
    );
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);

  return { items, addItem, removeItem, updateQuantity, clear, totalItems };
}
