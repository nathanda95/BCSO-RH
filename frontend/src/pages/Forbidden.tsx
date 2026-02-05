import { useSearchParams } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

const reasonMessages: Record<string, string> = {
  not_member: "You must be a member of the required Discord server to access this app.",
  oauth_error: "Discord returned an authorization error.",
  callback_failed: "Authentication failed. Please try again.",
  state_mismatch: "Session validation failed. Please try again.",
  missing_params: "Missing OAuth parameters. Please try again."
};

export default function Forbidden() {
  const [params] = useSearchParams();
  const { login } = useAuth();

  const reason = params.get("reason") ?? "unknown";
  const message = reasonMessages[reason] ?? "Access denied.";

  return (
    <div className="page">
      <div className="card">
        <h1>Access Denied</h1>
        <p>{message}</p>
        <button className="button" onClick={login}>Try Login Again</button>
      </div>
    </div>
  );
}
