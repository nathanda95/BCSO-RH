import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../api";
import { useAuth } from "../auth/AuthContext";

type ModuleDefinition = {
  id: string;
  title: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
};

type EditState = {
  title: string;
  description: string;
};

export default function TrainingModulesPage() {
  const navigate = useNavigate();
  const { permissions } = useAuth();
  const [modules, setModules] = useState<ModuleDefinition[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editState, setEditState] = useState<EditState>({ title: "", description: "" });

  const canEdit = permissions.includes("admin") || permissions.includes("mod");

  const editingModule = useMemo(
    () => modules.find((module) => module.id === editingId) ?? null,
    [modules, editingId]
  );

  async function loadModules() {
    setLoading(true);
    setError(null);
    const response = await apiFetch("/training/modules");
    if (!response.ok) {
      setError("Impossible de charger les modules.");
      setLoading(false);
      return;
    }
    const data = await response.json();
    setModules(data.modules ?? []);
    setLoading(false);
  }

  useEffect(() => {
    loadModules();
  }, []);

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    if (!canEdit || saving) return;
    setSaving(true);
    setError(null);
    const response = await apiFetch("/training/modules", {
      method: "POST",
      json: {
        title,
        description: description ? description : null
      }
    });
    if (!response.ok) {
      setError("Creation impossible.");
    } else {
      setTitle("");
      setDescription("");
      await loadModules();
    }
    setSaving(false);
  }

  function startEdit(module: ModuleDefinition) {
    setEditingId(module.id);
    setEditState({ title: module.title, description: module.description ?? "" });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditState({ title: "", description: "" });
  }

  async function handleUpdate() {
    if (!editingId || saving) return;
    setSaving(true);
    setError(null);
    const response = await apiFetch(`/training/modules/${editingId}`, {
      method: "PUT",
      json: {
        title: editState.title,
        description: editState.description ? editState.description : null
      }
    });
    if (!response.ok) {
      setError("Mise a jour impossible.");
    } else {
      await loadModules();
      cancelEdit();
    }
    setSaving(false);
  }

  async function handleDelete(moduleId: string) {
    if (!canEdit || saving) return;
    const confirmed = window.confirm("Supprimer ce module ? Les donnees cadets liees seront supprimees.");
    if (!confirmed) return;
    setSaving(true);
    setError(null);
    const response = await apiFetch(`/training/modules/${moduleId}`, {
      method: "DELETE"
    });
    if (!response.ok) {
      setError("Suppression impossible.");
    } else {
      await loadModules();
      if (editingId === moduleId) {
        cancelEdit();
      }
    }
    setSaving(false);
  }

  return (
    <div className="page page-wide">
      <div className="card">
        <div className="page-header">
          <div>
            <h1>Modules de formation</h1>
            <p>Creer et gerer les modules visibles sur les fiches cadets.</p>
          </div>
          <div className="actions">
            <button className="button secondary" onClick={() => navigate("/app")}>Retour</button>
          </div>
        </div>
        {loading ? (
          <p>Chargement...</p>
        ) : modules.length === 0 ? (
          <p className="muted">Aucun module cree.</p>
        ) : (
          <div className="list">
            {modules.map((module) => (
              <div className="audit-row" key={module.id}>
                <strong>{module.title}</strong>
                {module.description && <p className="muted">{module.description}</p>}
                {canEdit && (
                  <div className="actions">
                    <button className="button secondary" onClick={() => startEdit(module)}>Editer</button>
                    <button className="button secondary" onClick={() => handleDelete(module.id)}>Supprimer</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {canEdit && (
        <div className="card">
          <h2>Nouveau module</h2>
          <form className="form-grid" onSubmit={handleCreate}>
            <label className="field">
              <span>Titre</span>
              <input
                className="input"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                required
              />
            </label>
            <label className="field">
              <span>Description</span>
              <textarea
                className="input textarea"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
            </label>
            <div className="actions">
              <button className="button" type="submit" disabled={saving}>
                {saving ? "Creation..." : "Creer"}
              </button>
            </div>
          </form>
          {error && <p className="error">{error}</p>}
        </div>
      )}

      {canEdit && editingModule && (
        <div className="card">
          <h2>Editer le module</h2>
          <div className="form-grid">
            <label className="field">
              <span>Titre</span>
              <input
                className="input"
                value={editState.title}
                onChange={(event) => setEditState({ ...editState, title: event.target.value })}
                required
              />
            </label>
            <label className="field">
              <span>Description</span>
              <textarea
                className="input textarea"
                value={editState.description}
                onChange={(event) => setEditState({ ...editState, description: event.target.value })}
              />
            </label>
          </div>
          <div className="actions">
            <button className="button" onClick={handleUpdate} disabled={saving}>
              Enregistrer
            </button>
            <button className="button secondary" onClick={cancelEdit} disabled={saving}>
              Annuler
            </button>
          </div>
          {error && <p className="error">{error}</p>}
        </div>
      )}
    </div>
  );
}