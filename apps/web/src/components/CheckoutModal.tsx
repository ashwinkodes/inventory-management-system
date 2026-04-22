import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useClub } from "@/contexts/ClubContext";
import { api } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import type { CartItem } from "@/hooks/useCart";

interface Props {
  cart: {
    items: CartItem[];
    clear: () => void;
    totalItems: number;
  };
  onClose: () => void;
}

export default function CheckoutModal({ cart, onClose }: Props) {
  const { activeClub } = useClub();
  const queryClient = useQueryClient();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [tripName, setTripName] = useState("");
  const [purpose, setPurpose] = useState("");
  const [notes, setNotes] = useState("");

  const mutation = useMutation({
    mutationFn: () =>
      api.post("/requests", {
        clubId: activeClub!.id,
        startDate,
        endDate,
        tripName: tripName || undefined,
        purpose: purpose || undefined,
        notes: notes || undefined,
        items: cart.items.map((i) => ({
          gearId: i.gearId,
          quantity: i.quantity,
        })),
      }),
    onSuccess: () => {
      toast.success("Request submitted!");
      cart.clear();
      queryClient.invalidateQueries({ queryKey: ["my-requests"] });
      onClose();
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to submit request");
    },
  });

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Submit Gear Request</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
        <div className="rounded-md bg-gray-50 p-3">
          <p className="mb-2 text-sm font-medium">
            {cart.totalItems} item(s) for {activeClub?.name}
          </p>
          <ul className="space-y-1 text-sm text-gray-600">
            {cart.items.map((item) => (
              <li key={item.gearId}>
                {item.name} × {item.quantity}
              </li>
            ))}
          </ul>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-sm font-medium">Start Date</label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">End Date</label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Trip Name (optional)</label>
          <Input
            value={tripName}
            onChange={(e) => setTripName(e.target.value)}
            placeholder="e.g. Tongariro Crossing"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Purpose (optional)</label>
          <Textarea
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            placeholder="What's the trip for?"
            rows={2}
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Notes (optional)</label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any special requirements?"
            rows={2}
          />
        </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={() => mutation.mutate()}
              disabled={!startDate || !endDate || mutation.isPending}
            >
              {mutation.isPending ? "Submitting..." : "Submit Request"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
