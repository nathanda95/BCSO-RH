import { Route, Routes, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import AppPage from "./pages/AppPage";
import Forbidden from "./pages/Forbidden";
import CadetsPage from "./pages/CadetsPage";
import CadetDetail from "./pages/CadetDetail";
import TrainingModulesPage from "./pages/TrainingModulesPage";
import { useAuth } from "./auth/AuthContext";

function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="page">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <AppPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/cadets"
        element={
          <ProtectedRoute>
            <CadetsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/cadets/me"
        element={
          <ProtectedRoute>
            <CadetDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/cadets/:id"
        element={
          <ProtectedRoute>
            <CadetDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/training"
        element={
          <ProtectedRoute>
            <TrainingModulesPage />
          </ProtectedRoute>
        }
      />
      <Route path="/forbidden" element={<Forbidden />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
