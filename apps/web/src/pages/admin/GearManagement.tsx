import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useClub } from "@/contexts/ClubContext";
import { api } from "@/lib/api";
import { GEAR_CATEGORIES, GEAR_CONDITIONS } from "@gear/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Search, Plus, Edit2, Eye, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";

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
  isActive: boolean;
  notes: string | null;
  ownerClub: { id: string; name: string; slug: string };
  visibleTo: { club: { id: string; name: string } }[];
}

const emptyForm = {
  name: "",
  brand: "",
  model: "",
  category: "Backpacks" as string,
  description: "",
  condition: "GOOD",
  size: "",
  weight: "",
  ownerClubId: "",
  notes: "",
  quantity: 1,
};

export default function GearManagement() {
  const { clubs, activeClub } = useClub();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [visibilityGear, setVisibilityGear] = useState<GearItem | null>(null);
  const [visClubIds, setVisClubIds] = useState<string[]>([]);

  const { data: gear = [], isLoading } = useQuery({
    queryKey: ["admin-gear", activeClub?.id],
    queryFn: () =>
      api.get<GearItem[]>(
        activeClub ? `/gear?clubId=${activeClub.id}` : "/gear"
      ),
  });

  const saveMutation = useMutation({
    mutationFn: (data: typeof form) => {
      if (editingId) return api.put(`/gear/${editingId}`, data);
      return api.post("/gear", data);
    },
    onSuccess: () => {
      toast.success(editingId ? "Gear updated" : "Gear created");
      queryClient.invalidateQueries({ queryKey: ["admin-gear"] });
      closeForm();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/gear/${id}`),
    onSuccess: () => {
      toast.success("Gear deactivated");
      queryClient.invalidateQueries({ queryKey: ["admin-gear"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const visibilityMutation = useMutation({
    mutationFn: ({ gearId, clubIds }: { gearId: string; clubIds: string[] }) =>
      api.put(`/gear/${gearId}/visibility`, { clubIds }),
    onSuccess: () => {
      toast.success("Visibility updated");
      queryClient.invalidateQueries({ queryKey: ["admin-gear"] });
      setVisibilityGear(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function openCreate() {
    setEditingId(null);
    setForm({ ...emptyForm, ownerClubId: activeClub?.id || "" });
    setShowForm(true);
  }

  function openEdit(item: GearItem) {
    setEditingId(item.id);
    setForm({
      name: item.name,
      brand: item.brand || "",
      model: item.model || "",
      category: item.category,
      description: item.description || "",
      condition: item.condition,
      size: item.size || "",
      weight: item.weight || "",
      ownerClubId: item.ownerClub.id,
      notes: item.notes || "",
      quantity: item.quantity,
    });
    setShowForm(true);
  }

  function openVisibility(item: GearItem) {
    setVisibilityGear(item);
    setVisClubIds(item.visibleTo.map((v) => v.club.id));
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleImageUpload(gearId: string, file: File) {
    const fd = new FormData();
    fd.append("image", file);
    try {
      await api.upload(`/gear/${gearId}/image`, fd);
      toast.success("Image uploaded");
      queryClient.invalidateQueries({ queryKey: ["admin-gear"] });
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  const filtered = gear.filter((item) => {
    const matchesSearch =
      !search ||
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.brand?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !filterCategory || item.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Manage Gear</h1>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Gear
        </Button>
      </div>

      <div className="mb-4 flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="w-48">
          <option value="">All Categories</option>
          {GEAR_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-gray-900" />
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Condition</th>
                <th className="px-4 py-3 font-medium">Qty</th>
                <th className="px-4 py-3 font-medium">Shared With</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((item) => (
                <tr key={item.id} className={!item.isActive ? "opacity-50" : ""}>
                  <td className="px-4 py-3">
                    <div className="font-medium">{item.name}</div>
                    {item.brand && (
                      <div className="text-xs text-gray-500">{item.brand} {item.model}</div>
                    )}
                  </td>
                  <td className="px-4 py-3">{item.category}</td>
                  <td className="px-4 py-3">
                    <Badge variant="outline">{item.condition}</Badge>
                  </td>
                  <td className="px-4 py-3">{item.quantity}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {item.visibleTo.map((v) => (
                        <Badge key={v.club.id} variant="secondary" className="text-xs">
                          {v.club.name}
                        </Badge>
                      ))}
                      {item.visibleTo.length === 0 && (
                        <span className="text-xs text-gray-400">Owner only</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => openEdit(item)}>
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => openVisibility(item)}>
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      <label className="cursor-pointer inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-gray-100">
                        <Upload className="h-3.5 w-3.5" />
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleImageUpload(item.id, file);
                          }}
                        />
                      </label>
                      {item.isActive && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-500"
                          onClick={() => deleteMutation.mutate(item.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create/Edit Dialog */}
      {showForm && (
        <Dialog open onOpenChange={(o) => !o && closeForm()}>
          <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Gear" : "Add Gear"}</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              saveMutation.mutate(form);
            }}
            className="space-y-3"
          >
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1">
                <label className="text-sm font-medium">Name</label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Brand</label>
                <Input
                  value={form.brand}
                  onChange={(e) => setForm((p) => ({ ...p, brand: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Model</label>
                <Input
                  value={form.model}
                  onChange={(e) => setForm((p) => ({ ...p, model: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Category</label>
                <Select
                  value={form.category}
                  onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                >
                  {GEAR_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Condition</label>
                <Select
                  value={form.condition}
                  onChange={(e) => setForm((p) => ({ ...p, condition: e.target.value }))}
                >
                  {GEAR_CONDITIONS.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Quantity</label>
                <Input
                  type="number"
                  min={1}
                  value={form.quantity}
                  onChange={(e) => setForm((p) => ({ ...p, quantity: parseInt(e.target.value) || 1 }))}
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Owner Club</label>
                <Select
                  value={form.ownerClubId}
                  onChange={(e) => setForm((p) => ({ ...p, ownerClubId: e.target.value }))}
                  required
                >
                  <option value="">Select club</option>
                  {clubs.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Size</label>
                <Input
                  value={form.size}
                  onChange={(e) => setForm((p) => ({ ...p, size: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Weight</label>
                <Input
                  value={form.weight}
                  onChange={(e) => setForm((p) => ({ ...p, weight: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                rows={2}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Notes</label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                rows={2}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={closeForm}>
                Cancel
              </Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? "Saving..." : editingId ? "Update" : "Create"}
              </Button>
            </div>
          </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Visibility Dialog */}
      {visibilityGear && (
        <Dialog open onOpenChange={(o) => !o && setVisibilityGear(null)}>
          <DialogContent>
          <DialogHeader>
            <DialogTitle>Gear Visibility: {visibilityGear.name}</DialogTitle>
          </DialogHeader>
          <p className="mb-3 text-sm text-gray-500">
            Owner: {visibilityGear.ownerClub.name} (always has access).
            Select which other clubs can see and request this item.
          </p>
          <div className="space-y-2">
            {clubs
              .filter((c) => c.id !== visibilityGear.ownerClub.id)
              .map((club) => (
                <label
                  key={club.id}
                  className={`flex cursor-pointer items-center gap-3 rounded-md border p-3 ${
                    visClubIds.includes(club.id) ? "border-gray-900 bg-gray-50" : "border-gray-200"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={visClubIds.includes(club.id)}
                    onChange={() =>
                      setVisClubIds((prev) =>
                        prev.includes(club.id)
                          ? prev.filter((id) => id !== club.id)
                          : [...prev, club.id]
                      )
                    }
                    className="h-4 w-4"
                  />
                  <span className="text-sm font-medium">{club.name}</span>
                </label>
              ))}
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setVisibilityGear(null)}>
              Cancel
            </Button>
            <Button
              onClick={() =>
                visibilityMutation.mutate({
                  gearId: visibilityGear.id,
                  clubIds: visClubIds,
                })
              }
              disabled={visibilityMutation.isPending}
            >
              Save Visibility
            </Button>
          </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
