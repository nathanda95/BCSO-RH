import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiFetch } from "../api";
import { useAuth } from "../auth/AuthContext";

type UserRef = {
  id: string;
  username: string;
  discriminator: string | null;
} | null;

type RecruitmentSection = {
  comment: string | null;
  status: "PENDING" | "VALIDATED" | "REFUSED";
  signedBy: UserRef;
  signedAt: string | null;
};

type RecruitmentQuestionnaire = RecruitmentSection & {
  spreadsheetUrl: string | null;
  answersText: string | null;
};

type RecruitmentSport = RecruitmentSection & {
  timeMinutes: number | null;
};

type RecruitmentMedical = RecruitmentSection;

type TrainingModule = {
  id: string;
  moduleId: string;
  moduleTitle: string | null;
  moduleDescription: string | null;
  comment: string | null;
  rating1to10: number | null;
  attendance: "PRESENT" | "ABSENT" | "LATE";
  signedBy: UserRef;
  signedAt: string | null;
};

type Evaluation = {
  weeklyAverage: number | null;
  generalComment: string | null;
  writtenTestScore: number | null;
  scenarioScore: number | null;
  attitudeScore: number | null;
  totalScore: number | null;
  ppa: "ACQUIRED" | "NOT_ACQUIRED";
  training: "ACQUIRED" | "NOT_ACQUIRED";
  signedBy: UserRef;
  signedAt: string | null;
};

type CadetDetail = {
  id: string;
  firstName: string;
  lastName: string;
  cadetNumber: string;
  affectation: string | null;
  userId: string | null;
  userName: string | null;
  birthDate: string | null;
  archivedAt: string | null;
  recruitment: {
    questionnaire: RecruitmentQuestionnaire;
    sport: RecruitmentSport;
    medical: RecruitmentMedical;
  } | null;
  trainingModules: TrainingModule[];
  evaluation: Evaluation | null;
};

type AuditLog = {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  before: unknown | null;
  after: unknown | null;
  createdAt: string;
  user: UserRef;
};

type QuestionnaireDraft = {
  spreadsheetUrl: string;
  answersText: string;
  comment: string;
  status: "PENDING" | "VALIDATED" | "REFUSED";
};

type SportDraft = {
  comment: string;
  timeMinutes: string;
  status: "PENDING" | "VALIDATED" | "REFUSED";
};

type MedicalDraft = {
  comment: string;
  status: "PENDING" | "VALIDATED" | "REFUSED";
};

type TrainingDraft = {
  moduleId: string;
  moduleTitle: string | null;
  moduleDescription: string | null;
  comment: string;
  rating1to10: string;
  attendance: "PRESENT" | "ABSENT" | "LATE";
  signedAt: string | null;
};

type EvaluationDraft = {
  weeklyAverage: string;
  generalComment: string;
  writtenTestScore: string;
  scenarioScore: string;
  attitudeScore: string;
  totalScore: string;
  ppa: "ACQUIRED" | "NOT_ACQUIRED";
  training: "ACQUIRED" | "NOT_ACQUIRED";
};

type CadetInfoDraft = {
  firstName: string;
  lastName: string;
  cadetNumber: string;
  affectation: string;
  birthDate: string;
  userName: string;
};

function formatUserLabel(user: UserRef) {
  if (!user) return "";
  if (user.discriminator && user.discriminator !== "0") {
    return `${user.username}#${user.discriminator}`;
  }
  return user.username;
}

function formatSignedBy(user: UserRef, signedAt: string | null) {
  if (!signedAt) return null;
  const label = formatUserLabel(user);
  const date = new Date(signedAt).toLocaleString();
  return `Signe par ${label || "utilisateur"} le ${date}`;
}

export default function CadetDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { permissions } = useAuth();
  const [cadet, setCadet] = useState<CadetDetail | null>(null);
  const [audit, setAudit] = useState<AuditLog[]>([]);
  const [activeTab, setActiveTab] = useState("recruitment");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [questionnaire, setQuestionnaire] = useState<QuestionnaireDraft | null>(null);
  const [sport, setSport] = useState<SportDraft | null>(null);
  const [medical, setMedical] = useState<MedicalDraft | null>(null);
  const [training, setTraining] = useState<TrainingDraft[]>([]);
  const [evaluation, setEvaluation] = useState<EvaluationDraft | null>(null);
  const [cadetInfo, setCadetInfo] = useState<CadetInfoDraft | null>(null);

  const isAdmin = permissions.includes("admin");
  const canEdit = permissions.includes("admin") || permissions.includes("mod");
  const canEditCadet = canEdit && !!id;
  const showActions = canEdit;
  const isSelfView = !id;
  const backTarget = isSelfView ? "/app" : "/cadets";

  const signedFlags = useMemo(() => {
    return {
      questionnaire: cadet?.recruitment?.questionnaire.signedAt ?? null,
      sport: cadet?.recruitment?.sport.signedAt ?? null,
      medical: cadet?.recruitment?.medical.signedAt ?? null,
      evaluation: cadet?.evaluation?.signedAt ?? null
    };
  }, [cadet]);

  async function loadCadet() {
    const path = id ? `/cadets/${id}` : "/cadets/me";
    setError(null);
    const response = await apiFetch(path);
    if (!response.ok) {
      setError("Cadet introuvable.");
      return;
    }
    const data = await response.json();
    setCadet(data.cadet);
  }

  async function loadAudit() {
    if (!id) return;
    const response = await apiFetch(`/cadets/${id}/audit`);
    if (!response.ok) {
      return;
    }
    const data = await response.json();
    setAudit(data.audit ?? []);
  }

  useEffect(() => {
    loadCadet();
  }, [id]);

  useEffect(() => {
    if (!cadet?.recruitment || !cadet?.evaluation) return;
    const q = cadet.recruitment.questionnaire;
    const s = cadet.recruitment.sport;
    const m = cadet.recruitment.medical;
    setQuestionnaire({
      spreadsheetUrl: q.spreadsheetUrl ?? "",
      answersText: q.answersText ?? "",
      comment: q.comment ?? "",
      status: q.status
    });
    setSport({
      comment: s.comment ?? "",
      timeMinutes: s.timeMinutes !== null && s.timeMinutes !== undefined ? String(s.timeMinutes) : "",
      status: s.status
    });
    setMedical({
      comment: m.comment ?? "",
      status: m.status
    });
    setTraining(
      cadet.trainingModules.map((module) => ({
        moduleId: module.moduleId,
        moduleTitle: module.moduleTitle,
        moduleDescription: module.moduleDescription,
        comment: module.comment ?? "",
        rating1to10: module.rating1to10 !== null && module.rating1to10 !== undefined
          ? String(module.rating1to10)
          : "",
        attendance: module.attendance,
        signedAt: module.signedAt
      }))
    );
    setEvaluation({
      weeklyAverage: cadet.evaluation.weeklyAverage !== null && cadet.evaluation.weeklyAverage !== undefined
        ? String(cadet.evaluation.weeklyAverage)
        : "",
      generalComment: cadet.evaluation.generalComment ?? "",
      writtenTestScore: cadet.evaluation.writtenTestScore !== null && cadet.evaluation.writtenTestScore !== undefined
        ? String(cadet.evaluation.writtenTestScore)
        : "",
      scenarioScore: cadet.evaluation.scenarioScore !== null && cadet.evaluation.scenarioScore !== undefined
        ? String(cadet.evaluation.scenarioScore)
        : "",
      attitudeScore: cadet.evaluation.attitudeScore !== null && cadet.evaluation.attitudeScore !== undefined
        ? String(cadet.evaluation.attitudeScore)
        : "",
      totalScore: cadet.evaluation.totalScore !== null && cadet.evaluation.totalScore !== undefined
        ? String(cadet.evaluation.totalScore)
        : "",
      ppa: cadet.evaluation.ppa,
      training: cadet.evaluation.training
    });
    setCadetInfo({
      firstName: cadet.firstName,
      lastName: cadet.lastName,
      cadetNumber: cadet.cadetNumber,
      affectation: cadet.affectation ?? "",
      birthDate: cadet.birthDate ? cadet.birthDate.slice(0, 10) : "",
      userName: cadet.userName ?? ""
    });
  }, [cadet]);

  async function handleSaveQuestionnaire() {
    if (!id || !questionnaire) return;
    setSaving(true);
    setError(null);
    const response = await apiFetch(`/cadets/${id}/recruitment/questionnaire`, {
      method: "PATCH",
      json: {
        spreadsheetUrl: questionnaire.spreadsheetUrl || null,
        answersText: questionnaire.answersText || null,
        comment: questionnaire.comment || null,
        status: questionnaire.status
      }
    });
    if (!response.ok) {
      setError(response.status === 409 ? "Section verrouillee." : "Mise a jour impossible.");
    } else {
      const data = await response.json();
      setCadet((prev) => (prev ? { ...prev, recruitment: data.recruitment } : prev));
    }
    setSaving(false);
  }

  async function handleSaveCadetInfo() {
    if (!id || !cadetInfo) return;
    setSaving(true);
    setError(null);
    const response = await apiFetch(`/cadets/${id}`, {
      method: "PATCH",
      json: {
        firstName: cadetInfo.firstName,
        lastName: cadetInfo.lastName,
        cadetNumber: cadetInfo.cadetNumber,
        affectation: cadetInfo.affectation ? cadetInfo.affectation : null,
        birthDate: cadetInfo.birthDate ? cadetInfo.birthDate : null,
        userName: cadetInfo.userName ? cadetInfo.userName : null
      }
    });
    if (!response.ok) {
      setError(response.status === 409 ? "Numero deja utilise." : "Mise a jour impossible.");
    } else {
      await loadCadet();
    }
    setSaving(false);
  }

  async function handleSaveSport() {
    if (!id || !sport) return;
    setSaving(true);
    setError(null);
    const response = await apiFetch(`/cadets/${id}/recruitment/sport`, {
      method: "PATCH",
      json: {
        comment: sport.comment || null,
        timeMinutes: sport.timeMinutes ? Number(sport.timeMinutes) : null,
        status: sport.status
      }
    });
    if (!response.ok) {
      setError(response.status === 409 ? "Section verrouillee." : "Mise a jour impossible.");
    } else {
      const data = await response.json();
      setCadet((prev) => (prev ? { ...prev, recruitment: data.recruitment } : prev));
    }
    setSaving(false);
  }

  async function handleSaveMedical() {
    if (!id || !medical) return;
    setSaving(true);
    setError(null);
    const response = await apiFetch(`/cadets/${id}/recruitment/medical`, {
      method: "PATCH",
      json: {
        comment: medical.comment || null,
        status: medical.status
      }
    });
    if (!response.ok) {
      setError(response.status === 409 ? "Section verrouillee." : "Mise a jour impossible.");
    } else {
      const data = await response.json();
      setCadet((prev) => (prev ? { ...prev, recruitment: data.recruitment } : prev));
    }
    setSaving(false);
  }

  async function handleSaveModule(module: TrainingDraft) {
    if (!id) return;
    setSaving(true);
    setError(null);
    const response = await apiFetch(`/cadets/${id}/training/modules/${module.moduleId}`, {
      method: "PATCH",
      json: {
        comment: module.comment || null,
        rating1to10: module.rating1to10 ? Number(module.rating1to10) : null,
        attendance: module.attendance
      }
    });
    if (!response.ok) {
      setError(response.status === 409 ? "Module verrouille." : "Mise a jour impossible.");
    } else {
      await loadCadet();
    }
    setSaving(false);
  }

  async function handleSaveEvaluation() {
    if (!id || !evaluation) return;
    setSaving(true);
    setError(null);
    const response = await apiFetch(`/cadets/${id}/evaluation`, {
      method: "PATCH",
      json: {
        weeklyAverage: evaluation.weeklyAverage ? Number(evaluation.weeklyAverage) : null,
        generalComment: evaluation.generalComment || null,
        writtenTestScore: evaluation.writtenTestScore ? Number(evaluation.writtenTestScore) : null,
        scenarioScore: evaluation.scenarioScore ? Number(evaluation.scenarioScore) : null,
        attitudeScore: evaluation.attitudeScore ? Number(evaluation.attitudeScore) : null,
        totalScore: evaluation.totalScore ? Number(evaluation.totalScore) : null,
        ppa: evaluation.ppa,
        training: evaluation.training
      }
    });
    if (!response.ok) {
      setError(response.status === 409 ? "Section verrouillee." : "Mise a jour impossible.");
    } else {
      await loadCadet();
    }
    setSaving(false);
  }

  async function handleDeleteCadet() {
    if (!id || !canEditCadet || deleting || archiving) return;
    const confirmed = window.confirm(`Supprimer le cadet ${cadet?.lastName ?? ""} ${cadet?.firstName ?? ""} ?`);
    if (!confirmed) return;
    setDeleting(true);
    setError(null);
    const response = await apiFetch(`/cadets/${id}`, {
      method: "DELETE"
    });
    if (!response.ok) {
      setError("Suppression impossible.");
      setDeleting(false);
      return;
    }
    navigate("/cadets");
  }

  async function handleArchiveToggle() {
    if (!id || !canEditCadet || archiving) return;
    const nextArchived = !cadet?.archivedAt;
    const message = nextArchived
      ? `Archiver la fiche de ${cadet?.lastName ?? ""} ${cadet?.firstName ?? ""} ?`
      : `Desarchiver la fiche de ${cadet?.lastName ?? ""} ${cadet?.firstName ?? ""} ?`;
    const confirmed = window.confirm(message);
    if (!confirmed) return;
    setArchiving(true);
    setError(null);
    const response = await apiFetch(`/cadets/${id}`, {
      method: "PATCH",
      json: {
        archived: nextArchived
      }
    });
    if (!response.ok) {
      setError("Archivage impossible.");
      setArchiving(false);
      return;
    }
    const data = await response.json();
    setCadet(data.cadet ?? null);
    setArchiving(false);
  }

  async function handleSign(scope: string, moduleId?: string) {
    if (!id) return;
    setSaving(true);
    setError(null);
    const response = await apiFetch(`/cadets/${id}/sign`, {
      method: "POST",
      json: {
        scope,
        moduleId
      }
    });
    if (!response.ok) {
      setError(response.status === 409 ? "Deja signe." : "Signature impossible.");
    } else {
      await loadCadet();
      await loadAudit();
    }
    setSaving(false);
  }

  async function handleLoadAudit() {
    await loadAudit();
    setActiveTab("audit");
  }

  useEffect(() => {
    if (activeTab === "audit") {
      loadAudit();
    }
  }, [activeTab]);

  if (!cadet) {
    return (
      <div className="page">
        <div className="card">
          <h1>Cadet</h1>
          <p>{error ?? "Chargement..."}</p>
          <button className="button secondary" onClick={() => navigate(backTarget)}>Retour</button>
        </div>
      </div>
    );
  }

  const qSigned = formatSignedBy(cadet.recruitment?.questionnaire.signedBy ?? null, cadet.recruitment?.questionnaire.signedAt ?? null);
  const sSigned = formatSignedBy(cadet.recruitment?.sport.signedBy ?? null, cadet.recruitment?.sport.signedAt ?? null);
  const mSigned = formatSignedBy(cadet.recruitment?.medical.signedBy ?? null, cadet.recruitment?.medical.signedAt ?? null);
  const eSigned = formatSignedBy(cadet.evaluation?.signedBy ?? null, cadet.evaluation?.signedAt ?? null);

  return (
    <div className="page page-wide">
      <div className="card">
        <div className="page-header">
          <div>
            <h1>{cadet.lastName} {cadet.firstName}</h1>
            <p>Cadet #{cadet.cadetNumber}</p>
            {cadet.archivedAt && (
              <p className="badge warning">
                Archive le {new Date(cadet.archivedAt).toLocaleDateString()}
              </p>
            )}
          </div>
          <div className="actions">
            <button className="button secondary" onClick={() => navigate(backTarget)}>Retour</button>
            {showActions && canEditCadet && (
              <button
                className="button secondary"
                onClick={handleArchiveToggle}
                disabled={saving || deleting || archiving}
              >
                {cadet.archivedAt ? "Desarchiver" : "Archiver"}
              </button>
            )}
            {showActions && canEditCadet && (
              <button
                className="button secondary"
                onClick={handleDeleteCadet}
                disabled={saving || deleting || archiving}
              >
                {deleting ? "Suppression..." : "Supprimer"}
              </button>
            )}
          </div>
        </div>
        <div className="tabs">
          <button className={`tab ${activeTab === "recruitment" ? "active" : ""}`} onClick={() => setActiveTab("recruitment")}>Recrutement</button>
          <button className={`tab ${activeTab === "training" ? "active" : ""}`} onClick={() => setActiveTab("training")}>Formation</button>
          <button className={`tab ${activeTab === "evaluation" ? "active" : ""}`} onClick={() => setActiveTab("evaluation")}>Evaluation</button>
          <button className={`tab ${activeTab === "audit" ? "active" : ""}`} onClick={handleLoadAudit}>Historique</button>
        </div>
      </div>

      {cadetInfo && (
        <div className="card">
          <h2>Informations cadet</h2>
          <div className="form-grid">
            <label className="field">
              <span>Prenom</span>
              <input
                className="input"
                value={cadetInfo.firstName}
                onChange={(event) => setCadetInfo({ ...cadetInfo, firstName: event.target.value })}
                disabled={!canEditCadet}
              />
            </label>
            <label className="field">
              <span>Nom</span>
              <input
                className="input"
                value={cadetInfo.lastName}
                onChange={(event) => setCadetInfo({ ...cadetInfo, lastName: event.target.value })}
                disabled={!canEditCadet}
              />
            </label>
            <label className="field">
              <span>Numero</span>
              <input
                className="input"
                value={cadetInfo.cadetNumber}
                onChange={(event) => setCadetInfo({ ...cadetInfo, cadetNumber: event.target.value })}
                disabled={!canEditCadet}
              />
            </label>
            <label className="field">
              <span>Affectation</span>
              <input
                className="input"
                value={cadetInfo.affectation}
                onChange={(event) => setCadetInfo({ ...cadetInfo, affectation: event.target.value })}
                disabled={!canEditCadet}
              />
            </label>
            <label className="field">
              <span>Date d'inscription</span>
              <input
                className="input"
                type="date"
                value={cadetInfo.birthDate}
                onChange={(event) => setCadetInfo({ ...cadetInfo, birthDate: event.target.value })}
                disabled={!canEditCadet}
              />
            </label>
            <label className="field">
              <span>Nom utilisateur (optionnel)</span>
              <input
                className="input"
                value={cadetInfo.userName}
                onChange={(event) => setCadetInfo({ ...cadetInfo, userName: event.target.value })}
                disabled={!canEditCadet}
                placeholder="username exact"
              />
            </label>
          </div>
          {showActions && (
            <div className="actions">
              <button className="button" onClick={handleSaveCadetInfo} disabled={!canEditCadet || saving}>
                Enregistrer
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === "recruitment" && cadet.recruitment && questionnaire && sport && medical && (
        <div className="grid-columns">
          <div className="card">
            <h2>Questionnaire</h2>
            {qSigned && <p className="badge warning">{qSigned}</p>}
            {signedFlags.questionnaire && isAdmin && <p className="warning-text">Section signee, modification en tant qu'admin.</p>}
            <label className="field">
              <span>URL du tableur</span>
              <input
                className="input"
                value={questionnaire.spreadsheetUrl}
                onChange={(event) => setQuestionnaire({ ...questionnaire, spreadsheetUrl: event.target.value })}
                disabled={!canEdit || (!!signedFlags.questionnaire && !isAdmin)}
              />
            </label>
            <label className="field">
              <span>Reponses</span>
              <textarea
                className="input textarea"
                value={questionnaire.answersText}
                onChange={(event) => setQuestionnaire({ ...questionnaire, answersText: event.target.value })}
                disabled={!canEdit || (!!signedFlags.questionnaire && !isAdmin)}
              />
            </label>
            <label className="field">
              <span>Commentaire</span>
              <textarea
                className="input textarea"
                value={questionnaire.comment}
                onChange={(event) => setQuestionnaire({ ...questionnaire, comment: event.target.value })}
                disabled={!canEdit || (!!signedFlags.questionnaire && !isAdmin)}
              />
            </label>
            <label className="field">
              <span>Statut</span>
              <select
                className="input"
                value={questionnaire.status}
                onChange={(event) => setQuestionnaire({ ...questionnaire, status: event.target.value as QuestionnaireDraft["status"] })}
                disabled={!canEdit || (!!signedFlags.questionnaire && !isAdmin)}
              >
                <option value="PENDING">En attente</option>
                <option value="VALIDATED">Valide</option>
                <option value="REFUSED">Refuse</option>
              </select>
            </label>
            {showActions && (
              <div className="actions">
                <button className="button" onClick={handleSaveQuestionnaire} disabled={!canEdit || saving}>
                  Enregistrer
                </button>
                {!signedFlags.questionnaire && (
                  <button className="button secondary" onClick={() => handleSign("recruitment.questionnaire")} disabled={saving}>
                    Signer
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="card">
            <h2>Sport</h2>
            {sSigned && <p className="badge warning">{sSigned}</p>}
            {signedFlags.sport && isAdmin && <p className="warning-text">Section signee, modification en tant qu'admin.</p>}
            <label className="field">
              <span>Commentaire</span>
              <textarea
                className="input textarea"
                value={sport.comment}
                onChange={(event) => setSport({ ...sport, comment: event.target.value })}
                disabled={!canEdit || (!!signedFlags.sport && !isAdmin)}
              />
            </label>
            <label className="field">
              <span>Temps (minutes)</span>
              <input
                className="input"
                type="number"
                min={0}
                value={sport.timeMinutes}
                onChange={(event) => setSport({ ...sport, timeMinutes: event.target.value })}
                disabled={!canEdit || (!!signedFlags.sport && !isAdmin)}
              />
            </label>
            <label className="field">
              <span>Statut</span>
              <select
                className="input"
                value={sport.status}
                onChange={(event) => setSport({ ...sport, status: event.target.value as SportDraft["status"] })}
                disabled={!canEdit || (!!signedFlags.sport && !isAdmin)}
              >
                <option value="PENDING">En attente</option>
                <option value="VALIDATED">Valide</option>
                <option value="REFUSED">Refuse</option>
              </select>
            </label>
            {showActions && (
              <div className="actions">
                <button className="button" onClick={handleSaveSport} disabled={!canEdit || saving}>
                  Enregistrer
                </button>
                {!signedFlags.sport && (
                  <button className="button secondary" onClick={() => handleSign("recruitment.sport")} disabled={saving}>
                    Signer
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="card">
            <h2>Medical</h2>
            {mSigned && <p className="badge warning">{mSigned}</p>}
            {signedFlags.medical && isAdmin && <p className="warning-text">Section signee, modification en tant qu'admin.</p>}
            <label className="field">
              <span>Commentaire</span>
              <textarea
                className="input textarea"
                value={medical.comment}
                onChange={(event) => setMedical({ ...medical, comment: event.target.value })}
                disabled={!canEdit || (!!signedFlags.medical && !isAdmin)}
              />
            </label>
            <label className="field">
              <span>Statut</span>
              <select
                className="input"
                value={medical.status}
                onChange={(event) => setMedical({ ...medical, status: event.target.value as MedicalDraft["status"] })}
                disabled={!canEdit || (!!signedFlags.medical && !isAdmin)}
              >
                <option value="PENDING">En attente</option>
                <option value="VALIDATED">Valide</option>
                <option value="REFUSED">Refuse</option>
              </select>
            </label>
            {showActions && (
              <div className="actions">
                <button className="button" onClick={handleSaveMedical} disabled={!canEdit || saving}>
                  Enregistrer
                </button>
                {!signedFlags.medical && (
                  <button className="button secondary" onClick={() => handleSign("recruitment.medical")} disabled={saving}>
                    Signer
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "training" && (
        <div className="card">
          <h2>Modules de formation</h2>
          {training.map((module, index) => {
            const original = cadet.trainingModules.find((item) => item.moduleId === module.moduleId);
            const isLocked = !!module.signedAt;
            return (
              <div className="module-card" key={module.moduleId}>
                <div className="module-header">
                  <div>
                    <h3>{module.moduleTitle ?? "Module"}</h3>
                    {module.moduleDescription && <p className="muted">{module.moduleDescription}</p>}
                  </div>
                  {original?.signedAt && (
                    <span className="badge warning">{formatSignedBy(original.signedBy, original.signedAt)}</span>
                  )}
                </div>
                {isLocked && isAdmin && <p className="warning-text">Module signe, modification en tant qu'admin.</p>}
                <label className="field">
                  <span>Commentaire</span>
                  <textarea
                    className="input textarea"
                    value={module.comment}
                    onChange={(event) => {
                      const next = [...training];
                      next[index] = { ...module, comment: event.target.value };
                      setTraining(next);
                    }}
                    disabled={!canEdit || (isLocked && !isAdmin)}
                  />
                </label>
                <div className="row">
                  <label className="field">
                    <span>Note /10</span>
                    <input
                      className="input"
                      type="number"
                      min={1}
                      max={10}
                      value={module.rating1to10}
                      onChange={(event) => {
                        const next = [...training];
                        next[index] = { ...module, rating1to10: event.target.value };
                        setTraining(next);
                      }}
                      disabled={!canEdit || (isLocked && !isAdmin)}
                    />
                  </label>
                  <label className="field">
                    <span>Presence</span>
                    <select
                      className="input"
                      value={module.attendance}
                      onChange={(event) => {
                        const next = [...training];
                        next[index] = { ...module, attendance: event.target.value as TrainingDraft["attendance"] };
                        setTraining(next);
                      }}
                      disabled={!canEdit || (isLocked && !isAdmin)}
                    >
                      <option value="PRESENT">Present</option>
                      <option value="ABSENT">Absent</option>
                      <option value="LATE">Retard</option>
                    </select>
                  </label>
                </div>
                {showActions && (
                  <div className="actions">
                    <button className="button" onClick={() => handleSaveModule(module)} disabled={!canEdit || saving}>
                      Enregistrer
                    </button>
                    {!isLocked && (
                      <button
                        className="button secondary"
                        onClick={() => handleSign("training.module", module.moduleId)}
                        disabled={saving}
                      >
                        Signer
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {activeTab === "evaluation" && evaluation && cadet.evaluation && (
        <div className="card">
          <h2>Evaluation</h2>
          {eSigned && <p className="badge warning">{eSigned}</p>}
          {signedFlags.evaluation && isAdmin && <p className="warning-text">Section signee, modification en tant qu'admin.</p>}
          <div className="row">
            <label className="field">
              <span>Moyenne hebdo</span>
              <input
                className="input"
                type="number"
                value={evaluation.weeklyAverage}
                onChange={(event) => setEvaluation({ ...evaluation, weeklyAverage: event.target.value })}
                disabled={!canEdit || (!!signedFlags.evaluation && !isAdmin)}
              />
            </label>
            <label className="field">
              <span>Note ecrite</span>
              <input
                className="input"
                type="number"
                value={evaluation.writtenTestScore}
                onChange={(event) => setEvaluation({ ...evaluation, writtenTestScore: event.target.value })}
                disabled={!canEdit || (!!signedFlags.evaluation && !isAdmin)}
              />
            </label>
            <label className="field">
              <span>Scenario</span>
              <input
                className="input"
                type="number"
                value={evaluation.scenarioScore}
                onChange={(event) => setEvaluation({ ...evaluation, scenarioScore: event.target.value })}
                disabled={!canEdit || (!!signedFlags.evaluation && !isAdmin)}
              />
            </label>
            <label className="field">
              <span>Note d'attitude</span>
              <input
                className="input"
                type="number"
                value={evaluation.attitudeScore}
                onChange={(event) => setEvaluation({ ...evaluation, attitudeScore: event.target.value })}
                disabled={!canEdit || (!!signedFlags.evaluation && !isAdmin)}
              />
            </label>
            <label className="field">
              <span>Total</span>
              <input
                className="input"
                type="number"
                value={evaluation.totalScore}
                onChange={(event) => setEvaluation({ ...evaluation, totalScore: event.target.value })}
                disabled={!canEdit || (!!signedFlags.evaluation && !isAdmin)}
              />
            </label>
          </div>
          <label className="field">
            <span>Commentaire general</span>
            <textarea
              className="input textarea"
              value={evaluation.generalComment}
              onChange={(event) => setEvaluation({ ...evaluation, generalComment: event.target.value })}
              disabled={!canEdit || (!!signedFlags.evaluation && !isAdmin)}
            />
          </label>
          <div className="row">
            <label className="field">
              <span>PPA</span>
              <select
                className="input"
                value={evaluation.ppa}
                onChange={(event) => setEvaluation({ ...evaluation, ppa: event.target.value as EvaluationDraft["ppa"] })}
                disabled={!canEdit || (!!signedFlags.evaluation && !isAdmin)}
              >
                <option value="ACQUIRED">Acquis</option>
                <option value="NOT_ACQUIRED">Non acquis</option>
              </select>
            </label>
            <label className="field">
              <span>Validation évaluation</span>
              <select
                className="input"
                value={evaluation.training}
                onChange={(event) => setEvaluation({ ...evaluation, training: event.target.value as EvaluationDraft["training"] })}
                disabled={!canEdit || (!!signedFlags.evaluation && !isAdmin)}
              >
                <option value="ACQUIRED">Acquis</option>
                <option value="NOT_ACQUIRED">Non acquis</option>
              </select>
            </label>
          </div>
          {showActions && (
            <div className="actions">
              <button className="button" onClick={handleSaveEvaluation} disabled={!canEdit || saving}>
                Enregistrer
              </button>
              {!signedFlags.evaluation && (
                <button className="button secondary" onClick={() => handleSign("evaluation")} disabled={saving}>
                  Signer
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === "audit" && (
        <div className="card">
          <h2>Historique</h2>
          {audit.length === 0 ? (
            <p className="muted">Aucune activite enregistree.</p>
          ) : (
            <div className="list">
              {audit.map((entry) => (
                <div className="audit-row" key={entry.id}>
                  <div>
                    <strong>{entry.action}</strong> - {entry.entity}
                    <div className="muted">
                      {new Date(entry.createdAt).toLocaleString()} - {formatUserLabel(entry.user)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {error && <div className="card"><p className="error">{error}</p></div>}
    </div>
  );
}
