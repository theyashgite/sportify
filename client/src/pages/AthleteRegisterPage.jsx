import { useState } from "react";
import { Activity, ArrowLeft, ArrowRight, ShieldCheck } from "lucide-react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { getErrorMessage } from "../api";

export default function AthleteRegisterPage() {
  const { user, registerAthlete } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={user.role === "athlete" ? "/athlete" : "/"} replace />;

  async function submit(event) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const account = await registerAthlete(email, password);
      navigate(account.role === "athlete" ? "/athlete" : "/", { replace: true });
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-page athlete-register-page">
      <section className="auth-art">
        <div className="auth-art-top"><div className="brand brand-light"><span className="brand-mark"><Activity size={21} /></span><span>sportify<span className="brand-period">.</span></span></div><span className="art-edition">YOUR GAME, IN SYNC</span></div>
        <div className="art-center"><div className="art-label"><span className="live-pulse" /> MADE FOR THE ROSTER</div><h1>Your team.<br />Your <em>next play.</em></h1><p>Your club plans the sessions. Sportify brings your profile, team and upcoming schedule together.</p><div className="art-stats"><div><strong>01</strong><span>Your athlete profile</span></div><div><strong>∞</strong><span>Room to get better</span></div></div></div>
        <div className="art-bottom"><span>BUILT FOR THE LOVE OF THE GAME</span><span>02 — 04</span></div><div className="art-orb art-orb-one" /><div className="art-orb art-orb-two" />
      </section>
      <main className="auth-panel">
        <div className="auth-mobile-brand"><div className="brand"><span className="brand-mark"><Activity size={20} /></span><span>sportify<span className="brand-period">.</span></span></div></div>
        <div className="auth-form-wrap">
          <Link className="role-back-link" to="/login"><ArrowLeft size={15} /> Back to role selection</Link>
          <div className="welcome-tag">ATHLETE ACCESS</div><h2>Join your<br /><span>team workspace.</span></h2><p className="auth-subtitle">Use the email your coach added to your athlete profile.</p>
          <form className="auth-form" onSubmit={submit}>
            {error && <div className="form-error" role="alert">{error}</div>}
            <label>Email address<input type="email" autoComplete="email" placeholder="you@yourclub.com" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
            <label>Create password<input type="password" autoComplete="new-password" placeholder="At least 8 characters" value={password} onChange={(event) => setPassword(event.target.value)} minLength={8} required /></label>
            <button className="primary-button auth-submit" disabled={busy}>{busy ? "Creating athlete account…" : <>Create athlete account <ArrowRight size={17} /></>}</button>
          </form>
          <div className="auth-switch">Already signed up? <Link to="/athlete/login">Athlete sign in</Link></div>
          <div className="auth-switch auth-alternate">Not listed by your coach yet? Ask them to add your athlete profile first.</div>
          <div className="secure-note"><ShieldCheck size={16} /><span>Your account is protected with encrypted authentication.</span></div>
        </div>
        <div className="auth-footer"><span>© 2026 SPORTIFY</span><span>BUILT FOR YOUR NEXT WIN</span></div>
      </main>
    </div>
  );
}
