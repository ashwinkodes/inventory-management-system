import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useClub } from "@/contexts/ClubContext";
import { api } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { Check, X, PackageCheck, PackageOpen } from "lucide-react";
import { toast } from "sonner";

interface RequestItem {
  id: string;
  quantity: number;
  status: string;
  checkedOutAt: string | null;
  checkedInAt: string | null;
  gear: { id: string; name: string; category: string; brand: string | null };
}

interface Request {
  id: string;
  status: string;
  startDate: string;
  endDate: string;
  tripName: string | null;
  purpose: string | null;
  notes: string | null;
  adminNotes: string | null;
  createdAt: string;
  user: { id: string; name: string; email: string };
  club: { id: string; name: string };
  items: RequestItem[];
}

const statusVariant: Record<string, "default" | "success" | "warning" | "destructive" | "secondary"> = {
  PENDING: "warning",
  APPROVED: "success",
  CHECKED_OUT: "default",
  RETURNED: "secondary",
  REJECTED: "destructive",
  CANCELLED: "secondary",
};

export default function RequestManagement() {
  const { activeClub } = useClub();
  const queryClient = useQueryClient();
  const [filterStatus, setFilterStatus] = useState("");
  const [selected, setSelected] = useState<Request | null>(null);
  const [adminNotes, setAdminNotes] = useState("");

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["admin-requests", activeClub?.id, filterStatus],
    queryFn: () => {
      const params = new URLSearchParams();
      if (activeClub) params.set("clubId", activeClub.id);
      if (filterStatus) params.set("status", filterStatus);
      return api.get<Request[]>(`/requests?${params}`);
    },
  });

  const reviewMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.put<Request>(`/requests/${id}/review`, { status, adminNotes: adminNotes || undefined }),
    onSuccess: (data) => {
      toast.success(data.status === "APPROVED" ? "Request approved" : "Request rejected");
      queryClient.invalidateQueries({ queryKey: ["admin-requests"] });
      setSelected(data);
      setAdminNotes("");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const checkoutMutation = useMutation({
    mutationFn: ({ id, itemIds }: { id: string; itemIds: string[] }) =>
      api.post<Request>(`/requests/${id}/checkout`, { itemIds }),
    onSuccess: (data) => {
      toast.success("Items checked out");
      queryClient.invalidateQueries({ queryKey: ["admin-requests"] });
      setSelected(data);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const checkinMutation = useMutation({
    mutationFn: ({ id, items }: { id: string; items: { id: string }[] }) =>
      api.post<Request>(`/requests/${id}/checkin`, { items }),
    onSuccess: (data) => {
      toast.success("Items checked in");
      queryClient.invalidateQueries({ queryKey: ["admin-requests"] });
      setSelected(data);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Manage Requests</h1>
        <Select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="w-40"
        >
          <option value="">All Status</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="CHECKED_OUT">Checked Out</option>
          <option value="RETURNED">Returned</option>
          <option value="REJECTED">Rejected</option>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-gray-900" />
        </div>
      ) : requests.length === 0 ? (
        <p className="py-12 text-center text-gray-500">No requests found</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Member</th>
                <th className="px-4 py-3 font-medium">Trip</th>
                <th className="px-4 py-3 font-medium">Dates</th>
                <th className="px-4 py-3 font-medium">Items</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {requests.map((req) => (
                <tr key={req.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium">{req.user.name}</div>
                    <div className="text-xs text-gray-500">{req.user.email}</div>
                  </td>
                  <td className="px-4 py-3">{req.tripName || "—"}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {format(new Date(req.startDate), "MMM d")} –{" "}
                    {format(new Date(req.endDate), "MMM d, yyyy")}
                  </td>
                  <td className="px-4 py-3">{req.items.length} item(s)</td>
                  <td className="px-4 py-3">
                    <Badge variant={statusVariant[req.status]}>{req.status}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Button size="sm" variant="outline" onClick={() => setSelected(req)}>
                      View
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Request Detail Dialog */}
      {selected && (
        <Dialog open onOpenChange={(o) => !o && setSelected(null)}>
          <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>
              Request from {selected.user.name}
              <Badge variant={statusVariant[selected.status]} className="ml-2">
                {selected.status}
              </Badge>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Club:</span> {selected.club.name}
              </div>
              <div>
                <span className="text-gray-500">Dates:</span>{" "}
                {format(new Date(selected.startDate), "MMM d")} –{" "}
                {format(new Date(selected.endDate), "MMM d, yyyy")}
              </div>
              {selected.tripName && (
                <div>
                  <span className="text-gray-500">Trip:</span> {selected.tripName}
                </div>
              )}
              {selected.purpose && (
                <div className="col-span-2">
                  <span className="text-gray-500">Purpose:</span> {selected.purpose}
                </div>
              )}
              {selected.notes && (
                <div className="col-span-2">
                  <span className="text-gray-500">Notes:</span> {selected.notes}
                </div>
              )}
            </div>

            <div className="rounded-md border">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Item</th>
                    <th className="px-3 py-2 text-left font-medium">Qty</th>
                    <th className="px-3 py-2 text-left font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {selected.items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-3 py-2">
                        {item.gear.name}
                        <span className="text-gray-400 ml-1 text-xs">{item.gear.category}</span>
                      </td>
                      <td className="px-3 py-2">{item.quantity}</td>
                      <td className="px-3 py-2">
                        <Badge variant="outline" className="text-xs">{item.status}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Actions based on status */}
            {selected.status === "PENDING" && (
              <div className="space-y-3">
                <Textarea
                  placeholder="Admin notes (optional)"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={2}
                />
                <div className="flex gap-2">
                  <Button
                    className="flex-1 gap-2"
                    onClick={() =>
                      reviewMutation.mutate({ id: selected.id, status: "APPROVED" })
                    }
                    disabled={reviewMutation.isPending}
                  >
                    <Check className="h-4 w-4" /> Approve
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1 gap-2"
                    onClick={() =>
                      reviewMutation.mutate({ id: selected.id, status: "REJECTED" })
                    }
                    disabled={reviewMutation.isPending}
                  >
                    <X className="h-4 w-4" /> Reject
                  </Button>
                </div>
              </div>
            )}

            {selected.status === "APPROVED" && (
              <Button
                className="w-full gap-2"
                onClick={() =>
                  checkoutMutation.mutate({
                    id: selected.id,
                    itemIds: selected.items
                      .filter((i) => i.status === "APPROVED")
                      .map((i) => i.id),
                  })
                }
                disabled={checkoutMutation.isPending}
              >
                <PackageOpen className="h-4 w-4" /> Check Out All Items
              </Button>
            )}

            {selected.status === "CHECKED_OUT" && (
              <Button
                className="w-full gap-2"
                onClick={() =>
                  checkinMutation.mutate({
                    id: selected.id,
                    items: selected.items
                      .filter((i) => i.status === "CHECKED_OUT")
                      .map((i) => ({ id: i.id })),
                  })
                }
                disabled={checkinMutation.isPending}
              >
                <PackageCheck className="h-4 w-4" /> Check In All Items
              </Button>
            )}
          </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
