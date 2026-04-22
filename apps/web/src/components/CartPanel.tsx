import { Button } from "@/components/ui/button";
import { Minus, Plus, Trash2, ShoppingCart } from "lucide-react";
import type { CartItem } from "@/hooks/useCart";

interface CartPanelProps {
  cart: {
    items: CartItem[];
    removeItem: (gearId: string) => void;
    updateQuantity: (gearId: string, qty: number) => void;
    totalItems: number;
  };
  onCheckout: () => void;
}

export default function CartPanel({ cart, onCheckout }: CartPanelProps) {
  return (
    <div className="w-72 shrink-0">
      <div className="sticky top-6 rounded-lg border border-gray-200 bg-white p-4">
        <h3 className="mb-3 flex items-center gap-2 font-semibold">
          <ShoppingCart className="h-4 w-4" />
          Cart ({cart.totalItems})
        </h3>
        <div className="space-y-3">
          {cart.items.map((item) => (
            <div key={item.gearId} className="flex items-center gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{item.name}</p>
                <p className="text-xs text-gray-500">{item.category}</p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => cart.updateQuantity(item.gearId, item.quantity - 1)}
                  className="rounded p-0.5 hover:bg-gray-100"
                >
                  <Minus className="h-3 w-3" />
                </button>
                <span className="w-6 text-center text-sm">{item.quantity}</span>
                <button
                  onClick={() => cart.updateQuantity(item.gearId, item.quantity + 1)}
                  className="rounded p-0.5 hover:bg-gray-100"
                  disabled={item.quantity >= item.maxQuantity}
                >
                  <Plus className="h-3 w-3" />
                </button>
                <button
                  onClick={() => cart.removeItem(item.gearId)}
                  className="ml-1 rounded p-0.5 text-red-500 hover:bg-red-50"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
        <Button className="mt-4 w-full" onClick={onCheckout}>
          Request Gear
        </Button>
      </div>
    </div>
  );
}
