import { Activity, ArrowRight, ShieldCheck, Users, UserRound, Shield } from "lucide-react";
import { Link } from "react-router-dom";

const roles = [
  {
    title: "Coach / Manager",
    description: "Manage athletes, teams, events and your club schedule.",
    icon: Users,
    login: "/coach/login",
    register: "/register",
    action: "Continue as coach"
  },
  {
    title: "Athlete",
    description: "View your team profile and the events on your schedule.",
    icon: UserRound,
    login: "/athlete/login",
    register: "/athlete/register",
    action: "Continue as athlete"
  },
  {
    title: "Administrator",
    description: "Oversee coaches, team assignments and your club workspace.",
    icon: Shield,
    login: "/admin/login",
    action: "Continue as administrator"
  }
];

export default function RoleSelectionPage() {
  return (
    <div className="auth-page role-selection-page">
      <section className="auth-art">
        <div className="auth-art-top"><div className="brand brand-light"><span className="brand-mark"><Activity size={21} strokeWidth={2.5} /></span><span>sportify<span className="brand-period">.</span></span></div><span className="art-edition">THE CLUB OS · 2026</span></div>
        <div className="art-center">
          <div className="art-label"><span className="live-pulse" /> MADE FOR EVERY ROLE</div>
          <h1>One club.<br /><em>Your own game.</em></h1>
          <p>Choose how you use Sportify. Coaches manage the club; athletes keep their team and schedule close.</p>
          <div className="art-stats"><div><strong>01</strong><span>One home for your club</span></div><div><strong>∞</strong><span>Room to get better</span></div></div>
        </div>
        <div className="art-bottom"><span>BUILT FOR THE LOVE OF THE GAME</span><span>01 — 04</span></div>
        <div className="art-orb art-orb-one" /><div className="art-orb art-orb-two" />
      </section>
      <main className="auth-panel">
        <div className="auth-mobile-brand"><div className="brand"><span className="brand-mark"><Activity size={20} /></span><span>sportify<span className="brand-period">.</span></span></div></div>
        <div className="auth-form-wrap role-selection-wrap">
          <div className="welcome-tag">WELCOME TO SPORTIFY</div>
          <h2>How will you<br /><span>use your account?</span></h2>
          <p className="auth-subtitle">Choose your role to continue to the right sign-in.</p>
          <div className="role-choice-list">
            {roles.map(({ title, description, icon: Icon, login, register, action }) => (
              <section className="role-choice" key={title}>
                <div className="role-choice-icon"><Icon size={20} /></div>
                <div className="role-choice-copy"><h3>{title}</h3><p>{description}</p></div>
                <Link className="role-choice-login" to={login}>{action} <ArrowRight size={14} /></Link>
                {register && <Link className="role-choice-register" to={register}>Create account</Link>}
              </section>
            ))}
          </div>
          <div className="secure-note"><ShieldCheck size={16} /><span>Your account is protected with encrypted authentication.</span></div>
        </div>
        <div className="auth-footer"><span>© 2026 SPORTIFY</span><span>BUILT FOR YOUR NEXT WIN</span></div>
      </main>
    </div>
  );
}
