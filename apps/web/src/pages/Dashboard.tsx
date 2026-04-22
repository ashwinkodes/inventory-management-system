import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useClub } from "@/contexts/ClubContext";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import {
  ClipboardList,
  Clock,
  Package,
  Users,
  AlertTriangle,
  ArrowRight,
  PackageOpen,
} from "lucide-react";

interface MemberDashboard {
  activeRequests: number;
  pendingRequests: number;
  totalRequests: number;
  upcomingRentals: {
    id: string;
    status: string;
    startDate: string;
    endDate: string;
    tripName: string | null;
    club: { name: string };
    items: { id: string; gear: { name: string; category: string } }[];
  }[];
}

interface AdminDashboard {
  pendingRequests: number;
  pendingUsers: number;
  checkedOutRequests: number;
  totalGear: number;
  overdueRequests: number;
  recentRequests: {
    id: string;
    status: string;
    startDate: string;
    endDate: string;
    tripName: string | null;
    createdAt: string;
    user: { name: string; email: string };
    club: { name: string };
    items: { id: string; gear: { name: string } }[];
  }[];
  overdueDetails: {
    id: string;
    endDate: string;
    user: { name: string; email: string; phone: string | null };
    club: { name: string };
    items: { id: string; gear: { name: string; category: string } }[];
  }[];
}

const statusVariant: Record<string, "default" | "success" | "warning" | "destructive" | "secondary"> = {
  PENDING: "warning",
  APPROVED: "success",
  CHECKED_OUT: "default",
  RETURNED: "secondary",
  REJECTED: "destructive",
  CANCELLED: "secondary",
};

export default function Dashboard() {
  const { isAdmin } = useAuth();
  return isAdmin ? <AdminDash /> : <MemberDash />;
}

function StatCard({
  label,
  value,
  icon: Icon,
  variant = "default",
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  variant?: "default" | "warning" | "destructive";
}) {
  const colors = {
    default: "text-gray-900",
    warning: "text-amber-600",
    destructive: "text-red-600",
  };
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-gray-100 p-2">
          <Icon className="h-5 w-5 text-gray-600" />
        </div>
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className={`text-2xl font-bold ${colors[variant]}`}>{value}</p>
        </div>
      </div>
    </Card>
  );
}

function MemberDash() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-member"],
    queryFn: () => api.get<MemberDashboard>("/dashboard/member"),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-gray-900" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Dashboard</h1>

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <StatCard label="Pending Requests" value={data.pendingRequests} icon={Clock} variant={data.pendingRequests > 0 ? "warning" : "default"} />
        <StatCard label="Active Rentals" value={data.activeRequests} icon={PackageOpen} />
        <StatCard label="Total Requests" value={data.totalRequests} icon={ClipboardList} />
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Upcoming Rentals</h2>
        <Link to="/my-requests">
          <Button variant="ghost" size="sm" className="gap-1">
            View all <ArrowRight className="h-3 w-3" />
          </Button>
        </Link>
      </div>

      {data.upcomingRentals.length === 0 ? (
        <Card className="p-8 text-center text-gray-500">
          <Package className="mx-auto mb-2 h-10 w-10" />
          <p>No upcoming rentals</p>
          <Link to="/catalog">
            <Button variant="outline" size="sm" className="mt-3">
              Browse Catalog
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-3">
          {data.upcomingRentals.map((r) => (
            <Card key={r.id} className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={statusVariant[r.status]}>{r.status}</Badge>
                    <span className="text-sm text-gray-500">{r.club.name}</span>
                  </div>
                  {r.tripName && <h3 className="font-medium">{r.tripName}</h3>}
                  <p className="text-sm text-gray-600">
                    {format(new Date(r.startDate), "MMM d")} – {format(new Date(r.endDate), "MMM d, yyyy")}
                  </p>
                </div>
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {r.items.map((item) => (
                  <Badge key={item.id} variant="outline" className="text-xs">
                    {item.gear.name}
                  </Badge>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}

      <div className="mt-6">
        <Link to="/catalog">
          <Button className="gap-2">
            <Package className="h-4 w-4" /> Browse Gear Catalog
          </Button>
        </Link>
      </div>
    </div>
  );
}

function AdminDash() {
  const { activeClub } = useClub();

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-admin", activeClub?.id],
    queryFn: () => {
      const params = activeClub ? `?clubId=${activeClub.id}` : "";
      return api.get<AdminDashboard>(`/dashboard/admin${params}`);
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-gray-900" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Admin Dashboard</h1>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Pending Requests" value={data.pendingRequests} icon={Clock} variant={data.pendingRequests > 0 ? "warning" : "default"} />
        <StatCard label="Pending Users" value={data.pendingUsers} icon={Users} variant={data.pendingUsers > 0 ? "warning" : "default"} />
        <StatCard label="Checked Out" value={data.checkedOutRequests} icon={PackageOpen} />
        <StatCard label="Total Gear" value={data.totalGear} icon={Package} />
        <StatCard label="Overdue" value={data.overdueRequests} icon={AlertTriangle} variant={data.overdueRequests > 0 ? "destructive" : "default"} />
      </div>

      {/* Overdue section */}
      {data.overdueDetails.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-3 text-lg font-semibold text-red-600 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" /> Overdue Rentals
          </h2>
          <div className="space-y-3">
            {data.overdueDetails.map((r) => (
              <Card key={r.id} className="border-red-200 bg-red-50 p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-medium">{r.user.name}</div>
                    <div className="text-sm text-gray-600">{r.user.email}{r.user.phone && ` · ${r.user.phone}`}</div>
                    <p className="mt-1 text-sm text-red-600">
                      Due: {format(new Date(r.endDate), "MMM d, yyyy")} ({Math.ceil((Date.now() - new Date(r.endDate).getTime()) / 86400000)} days overdue)
                    </p>
                  </div>
                  <Badge variant="secondary">{r.club.name}</Badge>
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {r.items.map((item) => (
                    <Badge key={item.id} variant="outline" className="text-xs">
                      {item.gear.name}
                    </Badge>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Quick links */}
      <div className="mb-8 flex flex-wrap gap-2">
        <Link to="/admin/requests">
          <Button variant="outline" size="sm" className="gap-1">
            <ClipboardList className="h-3.5 w-3.5" /> Manage Requests
          </Button>
        </Link>
        <Link to="/admin/users">
          <Button variant="outline" size="sm" className="gap-1">
            <Users className="h-3.5 w-3.5" /> Manage Users
          </Button>
        </Link>
        <Link to="/admin/gear">
          <Button variant="outline" size="sm" className="gap-1">
            <Package className="h-3.5 w-3.5" /> Manage Gear
          </Button>
        </Link>
      </div>

      {/* Recent requests */}
      <h2 className="mb-3 text-lg font-semibold">Recent Requests</h2>
      {data.recentRequests.length === 0 ? (
        <p className="py-8 text-center text-gray-500">No requests yet</p>
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
              </tr>
            </thead>
            <tbody className="divide-y">
              {data.recentRequests.map((req) => (
                <tr key={req.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium">{req.user.name}</div>
                  </td>
                  <td className="px-4 py-3">{req.tripName || "—"}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {format(new Date(req.startDate), "MMM d")} – {format(new Date(req.endDate), "MMM d")}
                  </td>
                  <td className="px-4 py-3">{req.items.length} item(s)</td>
                  <td className="px-4 py-3">
                    <Badge variant={statusVariant[req.status]}>{req.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
