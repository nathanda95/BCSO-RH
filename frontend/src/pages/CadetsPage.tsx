import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../api";
import { useAuth } from "../auth/AuthContext";

type Cadet = {
  id: string;
  firstName: string;
  lastName: string;
  cadetNumber: string;
  birthDate: string | null;
  archivedAt: string | null;
};

export default function CadetsPage() {
  const navigate = useNavigate();
  const { permissions } = useAuth();
  const [cadets, setCadets] = useState<Cadet[]>([]);
  const [activeTab, setActiveTab] = useState<"active" | "archived">("active");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    cadetNumber: "",
    birthDate: "",
    userName: ""
  });

  const canEdit = permissions.includes("admin") || permissions.includes("mod");
  const canCreate = permissions.includes("admin") || permissions.includes("mod");

  async function loadCadets(query?: string, tab?: "active" | "archived") {
    const targetTab = tab ?? activeTab;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (query) {
        params.set("search", query);
      }
      if (targetTab === "archived") {
        params.set("archived", "true");
      }
      const suffix = params.toString();
      const response = await apiFetch(`/cadets${suffix ? `?${suffix}` : ""}`);
      if (!response.ok) {
        setError("Impossible de charger les cadets.");
        return;
      }
      const data = await response.json();
      setCadets(data.cadets ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCadets(search.trim() || undefined);
  }, [activeTab]);

  async function handleSearch(event: React.FormEvent) {
    event.preventDefault();
    await loadCadets(search.trim());
  }

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    if (!canCreate || creating) return;
    setCreating(true);
    setError(null);
    try {
      const response = await apiFetch("/cadets", {
        method: "POST",
        json: {
          firstName: form.firstName,
          lastName: form.lastName,
          cadetNumber: form.cadetNumber,
          birthDate: form.birthDate ? form.birthDate : null,
          userName: form.userName ? form.userName : null
        }
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        if (response.status === 409) {
          setError("Numero de cadet deja utilise.");
        } else if (payload?.error === "invalid_birth_date") {
          setError("Date d'inscription invalide.");
        } else {
          setError("Impossible de creer le cadet.");
        }
        return;
      }
      const data = await response.json();
      const created = data.cadet;
      if (created?.id) {
        navigate(`/cadets/${created.id}`);
      } else {
        await loadCadets(search.trim() || undefined);
      }
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(cadet: Cadet) {
    if (!canEdit || deletingId) return;
    const confirmed = window.confirm(`Supprimer le cadet ${cadet.lastName} ${cadet.firstName} ?`);
    if (!confirmed) return;
    setDeletingId(cadet.id);
    setError(null);
    try {
      const response = await apiFetch(`/cadets/${cadet.id}`, {
        method: "DELETE"
      });
      if (!response.ok) {
        setError("Suppression impossible.");
        return;
      }
      setCadets((prev) => prev.filter((item) => item.id !== cadet.id));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="page page-wide">
      <div className="card">
        <div className="page-header">
          <div>
            <h1>Cadets</h1>
            <p>Recherchez par nom, prenom ou numero.</p>
          </div>
          <div className="actions">
            <button className="button secondary" onClick={() => navigate("/app")}>Retour</button>
          </div>
        </div>
        <div className="tabs">
          <button
            className={`tab ${activeTab === "active" ? "active" : ""}`}
            onClick={() => setActiveTab("active")}
            type="button"
          >
            Actifs
          </button>
          <button
            className={`tab ${activeTab === "archived" ? "active" : ""}`}
            onClick={() => setActiveTab("archived")}
            type="button"
          >
            Archives
          </button>
        </div>
        <form className="search-row" onSubmit={handleSearch}>
          <input
            className="input"
            placeholder="Recherche"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <button className="button" type="submit">Chercher</button>
        </form>
        {loading ? (
          <p>Chargement...</p>
        ) : cadets.length === 0 ? (
          <p className="muted">
            {activeTab === "archived" ? "Aucune archive trouvee." : "Aucun cadet trouve."}
          </p>
        ) : (
          <div className="list">
            {cadets.map((cadet) => (
              <div className="cadet-row" key={cadet.id}>
                <button
                  className="row-button"
                  onClick={() => navigate(`/cadets/${cadet.id}`)}
                >
                  <span className="row-title">{cadet.lastName} {cadet.firstName}</span>
                  <span className="row-meta">#{cadet.cadetNumber}</span>
                  {activeTab === "archived" && cadet.archivedAt && (
                    <span className="row-meta">Archive le {new Date(cadet.archivedAt).toLocaleDateString()}</span>
                  )}
                </button>
                {canEdit && (
                  <div className="actions">
                    <button
                      className="button secondary"
                      onClick={() => navigate(`/cadets/${cadet.id}`)}
                    >
                      Modifier
                    </button>
                    <button
                      className="button secondary"
                      onClick={() => handleDelete(cadet)}
                      disabled={!!deletingId}
                    >
                      {deletingId === cadet.id ? "Suppression..." : "Supprimer"}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        {error && <p className="error">{error}</p>}
      </div>

      {activeTab === "active" && (
        <div className="card">
          <h2>Nouveau cadet</h2>
          <p>Creer une fiche cadet et initialiser les sections.</p>
          <form className="form-grid" onSubmit={handleCreate}>
            <label className="field">
              <span>Prenom</span>
              <input
                className="input"
                value={form.firstName}
                onChange={(event) => setForm({ ...form, firstName: event.target.value })}
                required
              />
            </label>
            <label className="field">
              <span>Nom</span>
              <input
                className="input"
                value={form.lastName}
                onChange={(event) => setForm({ ...form, lastName: event.target.value })}
                required
              />
            </label>
            <label className="field">
              <span>Numero</span>
              <input
                className="input"
                value={form.cadetNumber}
                onChange={(event) => setForm({ ...form, cadetNumber: event.target.value })}
                required
              />
            </label>
            <label className="field">
              <span>Date d'inscription</span>
              <input
                className="input"
                type="date"
                value={form.birthDate}
                onChange={(event) => setForm({ ...form, birthDate: event.target.value })}
              />
            </label>
            <label className="field">
              <span>Nom utilisateur (optionnel)</span>
              <input
                className="input"
                value={form.userName}
                onChange={(event) => setForm({ ...form, userName: event.target.value })}
                placeholder="username exact"
              />
            </label>
            <div className="actions">
              <button className="button" type="submit" disabled={!canCreate || creating}>
                {creating ? "Creation..." : "Creer"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
