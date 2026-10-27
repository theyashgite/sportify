import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Activity, ArrowLeft, ArrowRight, ShieldCheck } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { getErrorMessage } from "../api";

export default function RegisterPage() {
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", clubName: "", inviteCode: "" });
  const [mode, setMode] = useState("create");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  if (user) return <Navigate to="/" replace />;

  async function submit(event) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const clubDetails = mode === "create"
        ? { clubName: form.clubName }
        : { inviteCode: form.inviteCode };
      await register(form.name, form.email, form.password, clubDetails);
      navigate("/", { replace: true });
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-page register-page">
      <section className="auth-art">
        <div className="auth-art-top"><div className="brand brand-light"><span className="brand-mark"><Activity size={21} /></span><span>sportify<span className="brand-period">.</span></span></div><span className="art-edition">YOUR CLUB, CONNECTED</span></div>
        <div className="art-center"><div className="art-label"><span className="live-pulse" /> YOUR NEXT CHAPTER</div><h1>Build a team<br />that <em>moves.</em></h1><p>One shared space for the people, sessions and moments that make your club yours.</p><div className="art-stats"><div><strong>01</strong><span>One home for your club</span></div><div><strong>∞</strong><span>Room to get better</span></div></div></div>
        <div className="art-bottom"><span>BUILT FOR THE LOVE OF THE GAME</span><span>01 — 04</span></div><div className="art-orb art-orb-one" /><div className="art-orb art-orb-two" />
      </section>
      <main className="auth-panel">
        <div className="auth-mobile-brand"><div className="brand"><span className="brand-mark"><Activity size={20} /></span><span>sportify<span className="brand-period">.</span></span></div></div>
        <div className="auth-form-wrap">
          <Link className="role-back-link" to="/login"><ArrowLeft size={15} /> Back to role selection</Link>
          <div className="welcome-tag">GET STARTED</div><h2>{mode === "create" ? <>Create your<br /><span>club account.</span></> : <>Join your<br /><span>club team.</span></>}</h2><p className="auth-subtitle">Coaches in a club share its athletes, teams and events.</p>
          <form className="auth-form" onSubmit={submit}>
            {error && <div className="form-error" role="alert">{error}</div>}
            <label>Your name<input autoComplete="name" placeholder="Alex Morgan" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required maxLength={80} /></label>
            <label>Email address<input type="email" autoComplete="email" placeholder="you@yourclub.com" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required /></label>
            <label>Password<input type="password" autoComplete="new-password" placeholder="At least 8 characters" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required minLength={8} /></label>
            <div className="club-registration-mode" role="group" aria-label="Club account type">
              <button type="button" className={mode === "create" ? "club-mode-active" : ""} onClick={() => { setMode("create"); setError(""); }}>Create a new club</button>
              <button type="button" className={mode === "join" ? "club-mode-active" : ""} onClick={() => { setMode("join"); setError(""); }}>Join an existing club</button>
            </div>
            {mode === "create"
              ? <label>Club name<input autoComplete="organization" placeholder="e.g. Riverside Athletics" value={form.clubName} onChange={(event) => setForm({ ...form, clubName: event.target.value })} required maxLength={80} /></label>
              : <label>Club invite code<input autoComplete="off" placeholder="Enter the code from your coach" value={form.inviteCode} onChange={(event) => setForm({ ...form, inviteCode: event.target.value.toUpperCase() })} required maxLength={16} /></label>}
            <button className="primary-button auth-submit" disabled={busy}>{busy ? mode === "create" ? "Creating club…" : "Joining club…" : <>{mode === "create" ? "Create your account" : "Join your club"} <ArrowRight size={17} /></>}</button>
          </form>
          <div className="auth-switch">Already have an account? <Link to="/coach/login">Sign in</Link></div>
          <div className="secure-note"><ShieldCheck size={16} /><span>Your account is protected with encrypted authentication.</span></div>
        </div>
        <div className="auth-footer"><span>© 2026 SPORTIFY</span><span>BUILT FOR YOUR NEXT WIN</span></div>
      </main>
    </div>
  );
}
