import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { DatabaseProvider } from "./context/DatabaseContext";
import ProtectedRoute from "./routes/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import AdminDashboard from "./pages/AdminDashboard";
import WriterDashboard from "./pages/WriterDashboard";
import ReaderDashboard from "./pages/ReaderDashboard";

export default function App() {
  return (
    <ThemeProvider>
      <DatabaseProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              {/* Public Authentication Route */}
              <Route path="/login" element={<LoginPage />} />

              {/* Protected Routes for each Role */}
              <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
                <Route path="/admin" element={<AdminDashboard />} />
              </Route>

              <Route element={<ProtectedRoute allowedRoles={["admin", "writer"]} />}>
                <Route path="/writer" element={<WriterDashboard />} />
              </Route>

              <Route element={<ProtectedRoute allowedRoles={["admin", "writer", "reader"]} />}>
                <Route path="/reader" element={<ReaderDashboard />} />
              </Route>

              {/* Default redirect to login */}
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </DatabaseProvider>
    </ThemeProvider>
  );
}
