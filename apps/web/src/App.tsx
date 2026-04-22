import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/query-client";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/contexts/AuthContext";
import { ClubProvider } from "@/contexts/ClubContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Layout from "@/components/Layout";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import Dashboard from "@/pages/Dashboard";
import Catalog from "@/pages/Catalog";
import MyRequests from "@/pages/MyRequests";
import GearManagement from "@/pages/admin/GearManagement";
import RequestManagement from "@/pages/admin/RequestManagement";
import CalendarView from "@/pages/admin/CalendarView";
import UserManagement from "@/pages/admin/UserManagement";

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <ClubProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />

              <Route
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Dashboard />} />
                <Route path="catalog" element={<Catalog />} />
                <Route path="my-requests" element={<MyRequests />} />

                <Route
                  path="admin/gear"
                  element={
                    <ProtectedRoute requireAdmin>
                      <GearManagement />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="admin/requests"
                  element={
                    <ProtectedRoute requireAdmin>
                      <RequestManagement />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="admin/calendar"
                  element={
                    <ProtectedRoute requireAdmin>
                      <CalendarView />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="admin/users"
                  element={
                    <ProtectedRoute requireAdmin>
                      <UserManagement />
                    </ProtectedRoute>
                  }
                />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </ClubProvider>
        </AuthProvider>
      </BrowserRouter>
      <Toaster />
    </QueryClientProvider>
  );
}
