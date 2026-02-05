export default function PermissionsCard({
  permissions,
  roleIds,
  isMember
}: {
  permissions: string[];
  roleIds: string[];
  isMember: boolean;
}) {
  return (
    <div className="card">
      <h2>Permissions</h2>
      <p>Membership: {isMember ? "Member" : "Not a member"}</p>
      <div className="list">
        <strong>Computed Permissions</strong>
        {permissions.length === 0 ? <span>None</span> : <span>{permissions.join(", ")}</span>}
      </div>
      <div className="list">
        <strong>Discord Role IDs</strong>
        {roleIds.length === 0 ? <span>None</span> : <span>{roleIds.join(", ")}</span>}
      </div>
    </div>
  );
}
