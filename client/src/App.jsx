import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./auth/AuthContext";
import AppShell from "./components/AppShell";
import ProtectedRoute from "./components/ProtectedRoute";
import DashboardPage from "./pages/DashboardPage";
import LoginPage from "./pages/LoginPage";
import ManagementPage from "./components/ManagementPage";
import RegisterPage from "./pages/RegisterPage";
import AthleteRegisterPage from "./pages/AthleteRegisterPage";
import AthleteDashboardPage from "./pages/AthleteDashboardPage";
import RoleSelectionPage from "./pages/RoleSelectionPage";
import CoachesPage from "./pages/CoachesPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import CoachDetailPage from "./pages/CoachDetailPage";

function WorkspaceDashboard() {
  const { user } = useAuth();
  return user?.role === "admin" ? <AdminDashboardPage /> : <DashboardPage />;
}

export default function App() {
  return <AuthProvider><Routes>
    <Route path="/login" element={<RoleSelectionPage />} />
    <Route path="/coach/login" element={<LoginPage />} />
    <Route path="/athlete/login" element={<LoginPage />} />
    <Route path="/admin/login" element={<LoginPage />} />
    <Route path="/register" element={<RegisterPage />} />
    <Route path="/athlete/register" element={<AthleteRegisterPage />} />
    <Route element={<ProtectedRoute roles={["admin", "coach"]} />}><Route element={<AppShell />}>
      <Route index element={<WorkspaceDashboard />} />
      <Route element={<ProtectedRoute roles={["coach"]} />}>
        <Route path="athletes" element={<ManagementPage resource="athletes" />} />
        <Route path="teams" element={<ManagementPage resource="teams" />} />
        <Route path="events" element={<ManagementPage resource="events" />} />
      </Route>
      <Route element={<ProtectedRoute roles={["admin"]} />}>
        <Route path="coaches" element={<CoachesPage />} />
        <Route path="coaches/:coachId" element={<CoachDetailPage />} />
      </Route>
    </Route></Route>
    <Route element={<ProtectedRoute roles={["athlete"]} />}><Route element={<AppShell />}>
      <Route path="athlete" element={<AthleteDashboardPage />} />
    </Route></Route>
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes></AuthProvider>;
}
