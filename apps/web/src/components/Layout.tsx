import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useClub } from "@/contexts/ClubContext";
import { Button } from "@/components/ui/button";
import {
  Mountain,
  Package,
  ClipboardList,
  Calendar,
  Users,
  LogOut,
  ChevronDown,
  Menu,
  X,
  LayoutDashboard,
} from "lucide-react";
import { useState, useEffect } from "react";

const memberNav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/catalog", label: "Gear Catalog", icon: Package },
  { to: "/my-requests", label: "My Requests", icon: ClipboardList },
];

const adminNav = [
  { to: "/admin/gear", label: "Manage Gear", icon: Package },
  { to: "/admin/requests", label: "Manage Requests", icon: ClipboardList },
  { to: "/admin/calendar", label: "Calendar", icon: Calendar },
  { to: "/admin/users", label: "Users", icon: Users },
];

export default function Layout() {
  const { user, logout, isAdmin } = useAuth();
  const { clubs, activeClub, setActiveClub } = useClub();
  const location = useLocation();
  const navigate = useNavigate();
  const [clubDropdown, setClubDropdown] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const sidebarContent = (
    <>
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-gray-900">
            <Mountain className="h-4 w-4 text-white" />
          </div>
          <span className="font-semibold">Gear Inventory</span>
        </div>
        <button
          onClick={() => setMobileOpen(false)}
          className="rounded p-1 hover:bg-gray-100 lg:hidden"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Club selector */}
      <div className="relative border-b border-gray-200 px-3 py-3">
        <button
          onClick={() => setClubDropdown(!clubDropdown)}
          className="flex w-full items-center justify-between rounded-md border px-3 py-2 text-sm hover:bg-gray-50"
        >
          <span className="truncate">{activeClub?.name || "Select club"}</span>
          <ChevronDown className="h-4 w-4 shrink-0" />
        </button>
        {clubDropdown && (
          <div className="absolute left-3 right-3 top-full z-10 mt-1 rounded-md border bg-white shadow-lg">
            {clubs
              .filter((c) => isAdmin || user?.clubIds.includes(c.id))
              .map((club) => (
                <button
                  key={club.id}
                  onClick={() => {
                    setActiveClub(club);
                    setClubDropdown(false);
                  }}
                  className={`block w-full px-3 py-2 text-left text-sm hover:bg-gray-50 ${
                    activeClub?.id === club.id ? "bg-gray-50 font-medium" : ""
                  }`}
                >
                  {club.name}
                </button>
              ))}
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-3">
        {isAdmin && (
          <div className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
            Member
          </div>
        )}
        {memberNav.map(({ to, label, icon: Icon }) => {
          const active = location.pathname === to;
          return (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                active
                  ? "bg-gray-100 font-medium text-gray-900"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
        {isAdmin && (
          <>
            <div className="mb-2 mt-4 px-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
              Admin
            </div>
            {adminNav.map(({ to, label, icon: Icon }) => {
              const active = location.pathname === to;
              return (
                <Link
                  key={to}
                  to={to}
                  className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                    active
                      ? "bg-gray-100 font-medium text-gray-900"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              );
            })}
          </>
        )}
      </nav>

      {/* User info */}
      <div className="border-t border-gray-200 px-3 py-3">
        <div className="mb-2 px-3">
          <div className="text-sm font-medium">{user?.name}</div>
          <div className="text-xs text-gray-500">{user?.email}</div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2"
          onClick={() => {
            logout();
            navigate("/login");
          }}
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </Button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen">
      {/* Mobile header */}
      <div className="fixed left-0 right-0 top-0 z-30 flex h-14 items-center justify-between border-b bg-white px-4 lg:hidden">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-gray-900">
            <Mountain className="h-4 w-4 text-white" />
          </div>
          <span className="font-semibold text-sm truncate">
            {activeClub?.name || "Gear Inventory"}
          </span>
        </div>
        <button onClick={() => setMobileOpen(true)} className="rounded-md p-2 hover:bg-gray-100">
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-white transition-transform duration-200 lg:static lg:translate-x-0 lg:border-r lg:border-gray-200 ${
          mobileOpen ? "translate-x-0 shadow-xl" : "-translate-x-full"
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto pt-14 lg:pt-0">
        <div className="mx-auto max-w-6xl p-4 sm:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
