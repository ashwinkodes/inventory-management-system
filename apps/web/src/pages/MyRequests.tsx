import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format, isPast } from "date-fns";
import { ClipboardList, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface RequestItem {
  id: string;
  quantity: number;
  status: string;
  checkedOutAt: string | null;
  checkedInAt: string | null;
  conditionOnReturn: string | null;
  damageNotes: string | null;
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

const itemStatusVariant: Record<string, "default" | "success" | "warning" | "destructive" | "secondary"> = {
  PENDING: "warning",
  APPROVED: "success",
  CHECKED_OUT: "default",
  RETURNED: "secondary",
};

export default function MyRequests() {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<Request | null>(null);

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["my-requests"],
    queryFn: () => api.get<Request[]>("/requests/my"),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => api.put(`/requests/${id}/cancel`),
    onSuccess: () => {
      toast.success("Request cancelled");
      queryClient.invalidateQueries({ queryKey: ["my-requests"] });
      setSelected(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-gray-900" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">My Requests</h1>

      {requests.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
          <ClipboardList className="mb-2 h-12 w-12" />
          <p>No requests yet</p>
          <p className="text-sm">Browse the catalog to request gear</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => {
            const isOverdue = req.status === "CHECKED_OUT" && isPast(new Date(req.endDate));
            return (
              <Card
                key={req.id}
                className={`p-4 cursor-pointer hover:shadow-md transition-shadow ${isOverdue ? "border-red-200 bg-red-50" : ""}`}
                onClick={() => setSelected(req)}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={statusVariant[req.status]}>{req.status}</Badge>
                      <span className="text-sm text-gray-500">{req.club.name}</span>
                      {isOverdue && (
                        <span className="flex items-center gap-1 text-xs text-red-600 font-medium">
                          <AlertTriangle className="h-3 w-3" /> Overdue
                        </span>
                      )}
                    </div>
                    {req.tripName && (
                      <h3 className="font-medium">{req.tripName}</h3>
                    )}
                    <p className="text-sm text-gray-600">
                      {format(new Date(req.startDate), "MMM d, yyyy")} –{" "}
                      {format(new Date(req.endDate), "MMM d, yyyy")}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {["PENDING", "APPROVED"].includes(req.status) && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          cancelMutation.mutate(req.id);
                        }}
                        disabled={cancelMutation.isPending}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>

                <div className="mt-3 space-y-1">
                  {req.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between text-sm"
                    >
                      <span>
                        {item.gear.name}{" "}
                        <span className="text-gray-400">x {item.quantity}</span>
                      </span>
                      <Badge variant={itemStatusVariant[item.status] || "secondary"} className="text-xs">
                        {item.status}
                      </Badge>
                    </div>
                  ))}
                </div>

                {req.adminNotes && (
                  <div className="mt-3 rounded bg-gray-50 p-2 text-sm">
                    <span className="font-medium">Admin notes:</span> {req.adminNotes}
                  </div>
                )}

                <p className="mt-2 text-xs text-gray-400">
                  Requested {format(new Date(req.createdAt), "MMM d, yyyy 'at' h:mm a")}
                </p>
              </Card>
            );
          })}
        </div>
      )}

      {/* Detail dialog */}
      {selected && (
        <Dialog open onOpenChange={(o) => !o && setSelected(null)}>
          <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Request Details
              <Badge variant={statusVariant[selected.status]} className="ml-2">
                {selected.status}
              </Badge>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-500">Club:</span> {selected.club.name}
              </div>
              <div>
                <span className="text-gray-500">Dates:</span>{" "}
                {format(new Date(selected.startDate), "MMM d")} –{" "}
                {format(new Date(selected.endDate), "MMM d, yyyy")}
              </div>
              {selected.tripName && (
                <div className="col-span-2">
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

            {selected.adminNotes && (
              <div className="rounded bg-blue-50 p-3 text-sm">
                <span className="font-medium text-blue-800">Admin notes:</span>{" "}
                <span className="text-blue-700">{selected.adminNotes}</span>
              </div>
            )}

            {/* Items table */}
            <div className="rounded-md border">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Item</th>
                    <th className="px-3 py-2 text-left font-medium">Qty</th>
                    <th className="px-3 py-2 text-left font-medium">Status</th>
                    <th className="px-3 py-2 text-left font-medium">Details</th>
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
                        <Badge variant={itemStatusVariant[item.status] || "secondary"} className="text-xs">
                          {item.status}
                        </Badge>
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-500">
                        {item.checkedOutAt && (
                          <div>Out: {format(new Date(item.checkedOutAt), "MMM d, h:mm a")}</div>
                        )}
                        {item.checkedInAt && (
                          <div>In: {format(new Date(item.checkedInAt), "MMM d, h:mm a")}</div>
                        )}
                        {item.conditionOnReturn && (
                          <div>Condition: {item.conditionOnReturn}</div>
                        )}
                        {item.damageNotes && (
                          <div className="text-red-500">Damage: {item.damageNotes}</div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Cancel action */}
            {["PENDING", "APPROVED"].includes(selected.status) && (
              <Button
                variant="destructive"
                className="w-full"
                onClick={() => cancelMutation.mutate(selected.id)}
                disabled={cancelMutation.isPending}
              >
                Cancel Request
              </Button>
            )}

            <p className="text-xs text-gray-400 text-center">
              Requested {format(new Date(selected.createdAt), "MMM d, yyyy 'at' h:mm a")}
            </p>
          </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
