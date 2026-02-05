import { useAuth } from "../auth/AuthContext";
import PermissionsCard from "../components/PermissionsCard";

function getAvatarUrl(discordId: string, avatar: string | null) {
  if (!avatar) return null;
  return `https://cdn.discordapp.com/avatars/${discordId}/${avatar}.png`;
}

export default function AppPage() {
  const { user, permissions, roleIds, isMember, refresh, logout } = useAuth();

  if (!user) {
    return null;
  }

  const displayName = user.discriminator && user.discriminator !== "0"
    ? `${user.username}#${user.discriminator}`
    : user.username;

  const avatarUrl = getAvatarUrl(user.discordId, user.avatar);

  return (
    <div className="page">
      <div className="card">
        <div className="profile">
          {avatarUrl ? (
            <img className="avatar" src={avatarUrl} alt={displayName} />
          ) : (
            <div className="avatar placeholder" />
          )}
          <div>
            <h1>{displayName}</h1>
            <p>Discord ID: {user.discordId}</p>
            {user.siteAdmin && <span className="badge">Site Admin Override</span>}
          </div>
        </div>
        <div className="actions">
          <button className="button" onClick={refresh}>Refresh roles</button>
          <button className="button secondary" onClick={logout}>Logout</button>
        </div>
      </div>

      <PermissionsCard permissions={permissions} roleIds={roleIds} isMember={isMember} />
    </div>
  );
}
