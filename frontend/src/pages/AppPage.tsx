import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function AppPage() {
  const { permissions } = useAuth();
  const navigate = useNavigate();

  const isAdmin = permissions.includes("admin");
  const isMod = permissions.includes("mod");
  const isCadet = permissions.includes("cadet");

  return (
    <div className="page">
      <div className="card">
        <h1>Police Academy - RH</h1>
        <p>Bienvenue sur l'espace interne.</p>
        <div className="actions">
          {(isAdmin || isMod) && (
            <button className="button" onClick={() => navigate("/cadets")}>Gestion cadets</button>
          )}
          {(isAdmin || isMod) && (
            <button className="button secondary" onClick={() => navigate("/training")}>Formations</button>
          )}
          {isCadet && (
            <button className="button" onClick={() => navigate("/cadets/me")}>Ma fiche</button>
          )}
        </div>
        {!isAdmin && !isMod && !isCadet && (
          <p className="muted">Aucune permission specifique detectee.</p>
        )}
      </div>
    </div>
  );
}