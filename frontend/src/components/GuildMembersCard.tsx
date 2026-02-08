import { useEffect, useState } from "react";
import { apiFetch } from "../api";

type GuildMember = {
  id: string;
  username: string;
  discriminator: string | null;
  globalName: string | null;
  nick: string | null;
  displayName: string;
  avatar: string | null;
  roles: string[];
};

type GuildMembersResponse = {
  members: GuildMember[];
  total: number;
  fetchedAt: string;
};

function getAvatarUrl(discordId: string, avatar: string | null) {
  if (!avatar) return null;
  return `https://cdn.discordapp.com/avatars/${discordId}/${avatar}.png`;
}

export default function GuildMembersCard() {
  const [members, setMembers] = useState<GuildMember[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [fetchedAt, setFetchedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  async function loadMembers() {
    setLoading(true);
    setError(null);
    try {
      const response = await apiFetch("/admin/members");
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          setError("Access denied.");
          return;
        }
        const data = await response.json().catch(() => null);
        setError(data?.error ?? "Failed to load members.");
        return;
      }
      const data = (await response.json()) as GuildMembersResponse;
      setMembers(data.members ?? []);
      setTotal(data.total ?? data.members?.length ?? 0);
      setFetchedAt(data.fetchedAt ?? null);
    } catch (err) {
      setError("Failed to load members.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMembers();
  }, []);

  return (
    <div className="card">
      <div className="members-header">
        <div>
          <h2>Discord Members</h2>
          <p>Liste des membres du serveur et leurs rôles.</p>
        </div>
        <button className="button secondary" onClick={loadMembers} disabled={loading}>
          {loading ? "Loading..." : "Refresh list"}
        </button>
      </div>
      {error && <p className="error">{error}</p>}
      {!error && (
        <>
          <p className="meta">
            Total: {total}
            {fetchedAt ? ` · Updated ${new Date(fetchedAt).toLocaleString()}` : ""}
          </p>
          <div className="member-list">
            {members.length === 0 && <p>Aucun membre trouvé.</p>}
            {members.map((member) => {
              const avatarUrl = getAvatarUrl(member.id, member.avatar);
              const discriminator =
                member.discriminator && member.discriminator !== "0"
                  ? `#${member.discriminator}`
                  : "";
              return (
                <div key={member.id} className="member-row">
                  {avatarUrl ? (
                    <img className="avatar small" src={avatarUrl} alt={member.displayName} />
                  ) : (
                    <div className="avatar small placeholder" />
                  )}
                  <div className="member-main">
                    <div className="member-name">
                      <strong>{member.displayName}</strong>
                      <span className="member-handle">
                        {member.username}
                        {discriminator}
                      </span>
                    </div>
                    <div className="member-roles">
                      {member.roles.length === 0 ? (
                        <span className="muted">No roles</span>
                      ) : (
                        member.roles.map((role) => (
                          <span key={role} className="role-pill">
                            {role}
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
