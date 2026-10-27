import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { Activity, ArrowLeft, ArrowRight, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { getErrorMessage } from "../api";

export default function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const athleteMode = location.pathname.startsWith("/athlete/");
  const adminMode = location.pathname.startsWith("/admin/");
  const expectedRole = athleteMode ? "athlete" : adminMode ? "admin" : "coach";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={user.role === "athlete" ? "/athlete" : "/"} replace />;

  async function submit(event) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const signedInUser = await login(email, password, expectedRole);
      navigate(signedInUser.role === "athlete" ? "/athlete" : "/", { replace: true });
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-page">
      <section className="auth-art">
        <div className="auth-art-top"><div className="brand brand-light"><span className="brand-mark"><Activity size={21} strokeWidth={2.5} /></span><span>sportify<span className="brand-period">.</span></span></div><span className="art-edition">THE CLUB OS · 2026</span></div>
        <div className="art-center">
          <div className="art-label"><span className="live-pulse" /> MADE FOR THE MOMENT</div>
          <h1>Every team has<br />a <em>next level.</em></h1>
          <p>Bring your people, plans and performance together. Make the work behind every win feel effortless.</p>
          <div className="art-stats"><div><strong>01</strong><span>One home for your club</span></div><div><strong>∞</strong><span>Room to get better</span></div></div>
        </div>
        <div className="art-bottom"><span>BUILT FOR THE LOVE OF THE GAME</span><span>01 — 04</span></div>
        <div className="art-orb art-orb-one" /><div className="art-orb art-orb-two" />
      </section>
      <main className="auth-panel">
        <div className="auth-mobile-brand"><div className="brand"><span className="brand-mark"><Activity size={20} /></span><span>sportify<span className="brand-period">.</span></span></div></div>
        <div className="auth-form-wrap">
          <Link className="role-back-link" to="/login"><ArrowLeft size={15} /> Back to role selection</Link>
          <div className="welcome-tag">{athleteMode ? "ATHLETE ACCESS" : adminMode ? "ADMINISTRATOR ACCESS" : "COACH / MANAGER ACCESS"}</div>
          <h2>{athleteMode ? <>Your team.<br /><span>Your game.</span></> : adminMode ? <>Oversee your<br /><span>club workspace.</span></> : <>Sign in to your<br /><span>workspace.</span></>}</h2>
          <p className="auth-subtitle">{athleteMode ? "Sign in to see your team profile and what's coming up." : adminMode ? "Sign in to review your coaches and club activity." : "Good to see you again. Let's get your team moving."}</p>
          <form className="auth-form" onSubmit={submit}>
            {error && <div className="form-error" role="alert">{error}</div>}
            <label>Email address<input type="email" autoComplete="email" placeholder="you@yourclub.com" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
            <label>Password<span className="password-wrap"><input type={showPassword ? "text" : "password"} autoComplete="current-password" placeholder="Enter your password" value={password} onChange={(event) => setPassword(event.target.value)} required /><button type="button" className="password-toggle" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></span></label>
            <button className="primary-button auth-submit" disabled={busy}>{busy ? "Signing in…" : <>Sign in to Sportify <ArrowRight size={17} /></>}</button>
          </form>
          {!adminMode && <div className="auth-switch">{athleteMode ? <>Athlete account? <Link to="/athlete/register">Create athlete login</Link></> : <>New to the club? <Link to="/register">Create an account</Link></>}</div>}
          <div className="auth-switch auth-alternate">Not the right account type? <Link to="/login">Choose your role</Link></div>
          <div className="secure-note"><ShieldCheck size={16} /><span>Your account is protected with encrypted authentication.</span></div>
        </div>
        <div className="auth-footer"><span>© 2026 SPORTIFY</span><span>BUILT FOR YOUR NEXT WIN</span></div>
      </main>
    </div>
  );
}
