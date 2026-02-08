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
};

export default function CadetsPage() {
  const navigate = useNavigate();
  const { permissions } = useAuth();
  const [cadets, setCadets] = useState<Cadet[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    cadetNumber: "",
    birthDate: "",
    userName: ""
  });

  const canCreate = permissions.includes("admin") || permissions.includes("mod");

  async function loadCadets(query?: string) {
    setLoading(true);
    setError(null);
    try {
      const response = await apiFetch(`/cadets${query ? `?search=${encodeURIComponent(query)}` : ""}`);
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
    loadCadets();
  }, []);

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
          setError("Date de naissance invalide.");
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
        await loadCadets();
      }
    } finally {
      setCreating(false);
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
          <p className="muted">Aucun cadet trouve.</p>
        ) : (
          <div className="list">
            {cadets.map((cadet) => (
              <button
                key={cadet.id}
                className="row-button"
                onClick={() => navigate(`/cadets/${cadet.id}`)}
              >
                <span className="row-title">{cadet.lastName} {cadet.firstName}</span>
                <span className="row-meta">#{cadet.cadetNumber}</span>
              </button>
            ))}
          </div>
        )}
      </div>

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
            <span>Date de naissance</span>
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
        {error && <p className="error">{error}</p>}
      </div>
    </div>
  );
}
