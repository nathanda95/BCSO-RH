import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../api";
import { useAuth } from "../auth/AuthContext";

type Scenario = {
  id: string;
  contentText: string;
  updatedAt: string;
  updatedBy: {
    id: string;
    username: string;
    discriminator: string | null;
  } | null;
};

function formatUser(user: Scenario["updatedBy"]) {
  if (!user) return "";
  if (user.discriminator && user.discriminator !== "0") {
    return `${user.username}#${user.discriminator}`;
  }
  return user.username;
}

export default function ScenariosPage() {
  const navigate = useNavigate();
  const { permissions } = useAuth();
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = permissions.includes("admin");

  async function loadScenario() {
    setError(null);
    const response = await apiFetch("/scenarios");
    if (!response.ok) {
      setError("Impossible de charger les scenarios.");
      return;
    }
    const data = await response.json();
    setScenario(data.scenario);
    setContent(data.scenario?.contentText ?? "");
  }

  useEffect(() => {
    loadScenario();
  }, []);

  async function handleSave() {
    if (!isAdmin) return;
    setSaving(true);
    setError(null);
    const response = await apiFetch("/scenarios", {
      method: "PUT",
      json: { contentText: content }
    });
    if (!response.ok) {
      setError("Impossible de sauvegarder.");
    } else {
      const data = await response.json();
      setScenario(data.scenario);
    }
    setSaving(false);
  }

  return (
    <div className="page page-wide">
      <div className="card">
        <div className="page-header">
          <div>
            <h1>Scenarios</h1>
            <p>Catalogue global des scenarios.</p>
          </div>
          <div className="actions">
            <button className="button secondary" onClick={() => navigate("/app")}>Retour</button>
          </div>
        </div>
        {!isAdmin && (
          <p className="error">Acces reserve aux administrateurs.</p>
        )}
        <textarea
          className="input textarea tall"
          value={content}
          onChange={(event) => setContent(event.target.value)}
          disabled={!isAdmin}
        />
        <div className="actions">
          <button className="button" onClick={handleSave} disabled={!isAdmin || saving}>
            {saving ? "Sauvegarde..." : "Sauvegarder"}
          </button>
        </div>
        {scenario && (
          <p className="muted">
            Derniere mise a jour: {new Date(scenario.updatedAt).toLocaleString()}
            {scenario.updatedBy ? ` par ${formatUser(scenario.updatedBy)}` : ""}
          </p>
        )}
        {error && <p className="error">{error}</p>}
      </div>
    </div>
  );
}