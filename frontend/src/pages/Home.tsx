import { useAuth } from "../auth/AuthContext";

export default function Home() {
  const { login, user, loading } = useAuth();

  return (
    <div className="page">
      <div className="card">
        <h1>Discord Guild Access</h1>
        <p>Sign in with Discord to access the app. Membership is required.</p>
        {loading ? (
          <p>Loading...</p>
        ) : user ? (
          <a className="button" href="/app">Go to App</a>
        ) : (
          <button className="button" onClick={login}>Login with Discord</button>
        )}
      </div>
    </div>
  );
}
