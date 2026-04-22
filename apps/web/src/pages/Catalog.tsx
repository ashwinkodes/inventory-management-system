import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useClub } from "@/contexts/ClubContext";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useCart } from "@/hooks/useCart";
import CartPanel from "@/components/CartPanel";
import CheckoutModal from "@/components/CheckoutModal";
import { Search, Plus, ShoppingCart, Package, Calendar } from "lucide-react";
import { format } from "date-fns";

interface GearItem {
  id: string;
  name: string;
  brand: string | null;
  model: string | null;
  category: string;
  description: string | null;
  condition: string;
  size: string | null;
  weight: string | null;
  imageUrl: string | null;
  quantity: number;
  booked: number;
  available: number;
  ownerClub: { id: string; name: string; slug: string };
}

export default function Catalog() {
  const { activeClub } = useClub();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [showCheckout, setShowCheckout] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const cart = useCart();

  const { data: gear = [], isLoading } = useQuery({
    queryKey: ["catalog", activeClub?.id, startDate, endDate],
    queryFn: () => {
      const params = new URLSearchParams();
      if (activeClub) params.set("clubId", activeClub.id);
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);
      return api.get<GearItem[]>(`/gear/catalog?${params}`);
    },
    enabled: !!activeClub,
  });

  const hasDates = !!(startDate && endDate);

  const filtered = gear.filter((item) => {
    const matchesSearch =
      !search ||
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.brand?.toLowerCase().includes(search.toLowerCase()) ||
      item.category.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !category || item.category === category;
    return matchesSearch && matchesCategory;
  });

  const categories = [...new Set(gear.map((g) => g.category))].sort();

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gear Catalog</h1>
          <p className="text-gray-500">
            {activeClub?.name} — {gear.length} items
          </p>
        </div>
        {cart.totalItems > 0 && (
          <Button onClick={() => setShowCheckout(true)} className="gap-2">
            <ShoppingCart className="h-4 w-4" />
            Checkout ({cart.totalItems})
          </Button>
        )}
      </div>

      {/* Date range for availability */}
      <div className="mb-4 rounded-lg border bg-gray-50 p-3">
        <div className="flex items-center gap-2 mb-2">
          <Calendar className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Check availability for dates</span>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500">From</label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-8 w-auto text-sm"
              min={format(new Date(), "yyyy-MM-dd")}
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500">To</label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="h-8 w-auto text-sm"
              min={startDate || format(new Date(), "yyyy-MM-dd")}
            />
          </div>
          {hasDates && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setStartDate(""); setEndDate(""); }}
            >
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search gear..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={category} onChange={(e) => setCategory(e.target.value)} className="w-48">
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </Select>
      </div>

      <div className="flex gap-6">
        {/* Gear grid */}
        <div className="flex-1">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-gray-900" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <Package className="mb-2 h-12 w-12" />
              <p>No gear found</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((item) => (
                <GearCard
                  key={item.id}
                  item={item}
                  hasDates={hasDates}
                  inCart={cart.items.some((c) => c.gearId === item.id)}
                  onAdd={() =>
                    cart.addItem({
                      gearId: item.id,
                      name: item.name,
                      category: item.category,
                      maxQuantity: item.available,
                    })
                  }
                />
              ))}
            </div>
          )}
        </div>

        {/* Cart sidebar */}
        {cart.items.length > 0 && (
          <CartPanel
            cart={cart}
            onCheckout={() => setShowCheckout(true)}
          />
        )}
      </div>

      {showCheckout && (
        <CheckoutModal
          cart={cart}
          onClose={() => setShowCheckout(false)}
        />
      )}
    </div>
  );
}

function GearCard({
  item,
  hasDates,
  inCart,
  onAdd,
}: {
  item: GearItem;
  hasDates: boolean;
  inCart: boolean;
  onAdd: () => void;
}) {
  const conditionColor: Record<string, "success" | "warning" | "destructive" | "secondary"> = {
    NEW: "success",
    EXCELLENT: "success",
    GOOD: "success",
    FAIR: "warning",
    POOR: "destructive",
    RETIRED: "secondary",
  };

  const outOfStock = hasDates && item.available === 0;

  return (
    <Card className={`flex flex-col overflow-hidden ${outOfStock ? "opacity-60" : ""}`}>
      {item.imageUrl ? (
        <img
          src={item.imageUrl}
          alt={item.name}
          className="h-40 w-full object-cover"
        />
      ) : (
        <div className="flex h-40 items-center justify-center bg-gray-100">
          <Package className="h-10 w-10 text-gray-300" />
        </div>
      )}
      <div className="flex flex-1 flex-col p-4">
        <div className="mb-1 flex items-start justify-between gap-2">
          <h3 className="font-medium text-sm leading-tight">{item.name}</h3>
          <Badge variant={conditionColor[item.condition] || "secondary"} className="shrink-0">
            {item.condition}
          </Badge>
        </div>
        {item.brand && (
          <p className="text-xs text-gray-500">{item.brand}</p>
        )}
        <div className="mt-1 flex flex-wrap gap-1">
          <Badge variant="outline" className="text-xs">
            {item.category}
          </Badge>
          {item.ownerClub && (
            <Badge variant="secondary" className="text-xs">
              {item.ownerClub.slug.toUpperCase()}
            </Badge>
          )}
        </div>
        <p className="mt-1 text-xs text-gray-500">
          {hasDates ? (
            <>
              <span className={item.available > 0 ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                {item.available} available
              </span>
              {" / "}{item.quantity} total
              {item.booked > 0 && <span className="text-amber-600"> ({item.booked} booked)</span>}
            </>
          ) : (
            <>Qty: {item.quantity}</>
          )}
          {item.size && ` · ${item.size}`}
          {item.weight && ` · ${item.weight}`}
        </p>
        <div className="mt-auto pt-3">
          <Button
            size="sm"
            variant={inCart ? "secondary" : outOfStock ? "outline" : "default"}
            className="w-full gap-1"
            onClick={onAdd}
            disabled={inCart || outOfStock}
          >
            {inCart ? "In Cart" : outOfStock ? "Unavailable" : <><Plus className="h-3 w-3" /> Add to Cart</>}
          </Button>
        </div>
      </div>
    </Card>
  );
}
