import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { format } from "date-fns";
import { UserCheck, UserX, Shield, Users as UsersIcon } from "lucide-react";
import { toast } from "sonner";

interface UserClub {
  club: { id: string; name: string; slug: string };
}

interface User {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: string;
  isApproved: boolean;
  approvedAt: string | null;
  createdAt: string;
  clubs: UserClub[];
}

export default function UserManagement() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<"pending" | "all">("pending");

  const { data: pendingUsers = [], isLoading: loadingPending } = useQuery({
    queryKey: ["pending-users"],
    queryFn: () => api.get<User[]>("/users/pending"),
  });

  const { data: allUsers = [], isLoading: loadingAll } = useQuery({
    queryKey: ["all-users"],
    queryFn: () => api.get<User[]>("/users"),
    enabled: tab === "all",
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => api.put(`/users/${id}/approve`),
    onSuccess: () => {
      toast.success("User approved");
      queryClient.invalidateQueries({ queryKey: ["pending-users"] });
      queryClient.invalidateQueries({ queryKey: ["all-users"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/users/${id}/reject`),
    onSuccess: () => {
      toast.success("User rejected");
      queryClient.invalidateQueries({ queryKey: ["pending-users"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const roleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) =>
      api.put(`/users/${id}`, { role }),
    onSuccess: () => {
      toast.success("Role updated");
      queryClient.invalidateQueries({ queryKey: ["all-users"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">User Management</h1>

      <div className="mb-4 flex gap-2">
        <Button
          variant={tab === "pending" ? "default" : "outline"}
          onClick={() => setTab("pending")}
          className="gap-2"
        >
          <UserCheck className="h-4 w-4" />
          Pending ({pendingUsers.length})
        </Button>
        <Button
          variant={tab === "all" ? "default" : "outline"}
          onClick={() => setTab("all")}
          className="gap-2"
        >
          <UsersIcon className="h-4 w-4" />
          All Users
        </Button>
      </div>

      {tab === "pending" && (
        <>
          {loadingPending ? (
            <div className="flex justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-gray-900" />
            </div>
          ) : pendingUsers.length === 0 ? (
            <p className="py-12 text-center text-gray-500">No pending approvals</p>
          ) : (
            <div className="space-y-3">
              {pendingUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between rounded-lg border bg-white p-4"
                >
                  <div>
                    <div className="font-medium">{user.name}</div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                    {user.phone && (
                      <div className="text-sm text-gray-500">{user.phone}</div>
                    )}
                    <div className="mt-1 flex gap-1">
                      {user.clubs.map((uc) => (
                        <Badge key={uc.club.id} variant="secondary" className="text-xs">
                          {uc.club.slug.toUpperCase()}
                        </Badge>
                      ))}
                    </div>
                    <div className="mt-1 text-xs text-gray-400">
                      Registered {format(new Date(user.createdAt), "MMM d, yyyy")}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => approveMutation.mutate(user.id)}
                      disabled={approveMutation.isPending}
                      className="gap-1"
                    >
                      <UserCheck className="h-3.5 w-3.5" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => rejectMutation.mutate(user.id)}
                      disabled={rejectMutation.isPending}
                      className="gap-1"
                    >
                      <UserX className="h-3.5 w-3.5" />
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === "all" && (
        <>
          {loadingAll ? (
            <div className="flex justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-gray-900" />
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left">
                  <tr>
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Email</th>
                    <th className="px-4 py-3 font-medium">Clubs</th>
                    <th className="px-4 py-3 font-medium">Role</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {allUsers.map((user) => (
                    <tr key={user.id}>
                      <td className="px-4 py-3 font-medium">{user.name}</td>
                      <td className="px-4 py-3 text-gray-500">{user.email}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {user.clubs.map((uc) => (
                            <Badge key={uc.club.id} variant="secondary" className="text-xs">
                              {uc.club.slug.toUpperCase()}
                            </Badge>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Select
                          value={user.role}
                          onChange={(e) =>
                            roleMutation.mutate({ id: user.id, role: e.target.value })
                          }
                          className="w-28 h-8 text-xs"
                        >
                          <option value="MEMBER">Member</option>
                          <option value="ADMIN">Admin</option>
                        </Select>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={user.isApproved ? "success" : "warning"}>
                          {user.isApproved ? "Active" : "Pending"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {format(new Date(user.createdAt), "MMM d, yyyy")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
