import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Mountain, CheckCircle } from "lucide-react";

interface Club {
  id: string;
  name: string;
  slug: string;
}

export default function Register() {
  const { register } = useAuth();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [form, setForm] = useState({
    email: "",
    password: "",
    name: "",
    phone: "",
    clubIds: [] as string[],
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get<Club[]>("/clubs").then(setClubs).catch(() => {});
  }, []);

  function toggleClub(clubId: string) {
    setForm((prev) => ({
      ...prev,
      clubIds: prev.clubIds.includes(clubId)
        ? prev.clubIds.filter((id) => id !== clubId)
        : [...prev.clubIds, clubId],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const msg = await register(form);
      setSuccess(msg);
    } catch (err: any) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-6">
            <CheckCircle className="mx-auto h-12 w-12 text-green-600 mb-4" />
            <h2 className="text-lg font-semibold mb-2">Registration Submitted</h2>
            <p className="text-gray-500 mb-4">{success}</p>
            <Link to="/login">
              <Button variant="outline">Back to Login</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-gray-900">
            <Mountain className="h-6 w-6 text-white" />
          </div>
          <CardTitle>Create Account</CardTitle>
          <CardDescription>Join your club's gear rental system</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium">Full Name</label>
              <Input
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="Jane Smith"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                placeholder="you@auckland.ac.nz"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Password</label>
              <Input
                type="password"
                value={form.password}
                onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                minLength={6}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Phone (optional)</label>
              <Input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Select your clubs</label>
              <div className="space-y-2">
                {clubs.map((club) => (
                  <label
                    key={club.id}
                    className={`flex cursor-pointer items-center gap-3 rounded-md border p-3 transition-colors ${
                      form.clubIds.includes(club.id)
                        ? "border-gray-900 bg-gray-50"
                        : "border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={form.clubIds.includes(club.id)}
                      onChange={() => toggleClub(club.id)}
                      className="h-4 w-4"
                    />
                    <div>
                      <div className="font-medium text-sm">{club.name}</div>
                      <div className="text-xs text-gray-500">{club.slug.toUpperCase()}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={loading || form.clubIds.length === 0}
            >
              {loading ? "Registering..." : "Register"}
            </Button>
            <p className="text-center text-sm text-gray-500">
              Already have an account?{" "}
              <Link to="/login" className="text-gray-900 underline">
                Sign in
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
