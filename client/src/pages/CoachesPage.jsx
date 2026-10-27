import { useEffect, useState } from "react";
import { Activity, Check, Plus, ShieldCheck, Users, X } from "lucide-react";
import { Link } from "react-router-dom";
import api, { getErrorMessage } from "../api";

function formatDate(value) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

export default function CoachesPage() {
  const [coaches, setCoaches] = useState(null);
  const [error, setError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    api.get("/clubs/coaches")
      .then(({ data }) => setCoaches(data.coaches))
      .catch((requestError) => setError(getErrorMessage(requestError)));
  }, []);

  if (error) return <div className="notice-error" role="alert">{error}</div>;
  if (!coaches) return <div className="loading-line"><span className="spinner" /> Loading your coaches…</div>;

  async function addCoach(event) {
    event.preventDefault();
    setFormError("");
    setBusy(true);
    try {
      const { data } = await api.post("/clubs/coaches", { name, email, password });
      setCoaches((current) => [...current, data.coach].sort((first, second) => first.name.localeCompare(second.name)));
      setName("");
      setEmail("");
      setPassword("");
      setFormOpen(false);
    } catch (requestError) {
      setFormError(getErrorMessage(requestError));
    } finally {
      setBusy(false);
    }
  }

  const assignedTeams = coaches.reduce((total, coach) => total + coach.teams.length, 0);
  const assignedAthletes = coaches.reduce((total, coach) => total + coach.athleteCount, 0);

  return (
    <div className="coaches-page">
      <div className="welcome-row">
        <div><div className="eyebrow"><span className="eyebrow-line" /> ADMINISTRATOR WORKSPACE</div><h1>Your coaches<span>.</span></h1><p>Review coach accounts and the teams and athletes assigned to each one.</p></div>
        <button className="primary-button" type="button" onClick={() => { setFormError(""); setFormOpen(true); }}><Plus size={16} /> Add coach</button>
      </div>
      <div className="coach-summary-grid">
        <div className="stat-card"><div className="stat-top"><span className="stat-icon icon-lime"><Users size={19} /></span></div><div className="stat-value">{coaches.length}</div><div className="stat-label">Coach accounts</div><div className="stat-detail">Registered in your club</div></div>
        <div className="stat-card"><div className="stat-top"><span className="stat-icon icon-violet"><Activity size={19} /></span></div><div className="stat-value">{assignedTeams}</div><div className="stat-label">Assigned teams</div><div className="stat-detail">Matched by coach account email</div></div>
        <div className="stat-card"><div className="stat-top"><span className="stat-icon icon-blue"><ShieldCheck size={19} /></span></div><div className="stat-value">{assignedAthletes}</div><div className="stat-label">Athletes on those teams</div><div className="stat-detail">Across assigned teams</div></div>
      </div>
      <section className="surface-card coach-directory">
        <div className="section-heading"><div><span className="section-kicker">COACH DIRECTORY</span><h2>Coach accounts and assignments</h2></div></div>
        {coaches.length ? <div className="coach-directory-list">{coaches.map((coach) => (
          <Link className="coach-directory-card coach-directory-card-link" to={`/coaches/${coach.id}`} key={coach.id} aria-label={`View ${coach.name}'s profile`}>
            <div className="coach-directory-heading"><div className="coach-directory-avatar">{coach.name.trim().charAt(0).toUpperCase()}</div><div><h3>{coach.name}</h3><span>{coach.email}</span></div><span className="coach-joined">Joined {formatDate(coach.joinedAt)}</span></div>
            <div className="coach-assignment-summary"><strong>{coach.teams.length} {coach.teams.length === 1 ? "team" : "teams"}</strong><span>{coach.athleteCount} {coach.athleteCount === 1 ? "athlete" : "athletes"}</span></div>
            {coach.teams.length ? <div className="coach-team-list">{coach.teams.map((team) => <div className="coach-team-item" key={team.id}><strong>{team.name}</strong><span>{team.sport}</span><small>{team.athletes} {team.athletes === 1 ? "athlete" : "athletes"}</small></div>)}</div> : <p className="coach-no-assignments">No teams are linked yet. Add this coach’s account email to a team’s coach contact details to track its roster here.</p>}
            <span className="coach-profile-hint-link">View coach details <span aria-hidden="true">→</span></span>
          </Link>
        ))}</div> : <div className="empty-inline"><Users size={24} /><strong>No coach accounts yet</strong><span>Coaches who register with your club invite code will appear here.</span></div>}
      </section>
      {formOpen && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) setFormOpen(false); }}>
        <section className="edit-modal add-coach-modal" role="dialog" aria-modal="true" aria-labelledby="add-coach-title">
          <div className="modal-header">
            <div><span className="section-kicker">COACH ACCOUNT</span><h2 id="add-coach-title">Add a coach to your club</h2></div>
            <button type="button" className="icon-button" aria-label="Close" disabled={busy} onClick={() => setFormOpen(false)}><X size={19} /></button>
          </div>
          <p className="add-coach-intro">This creates a coach login in your club. Share the initial password securely so they can sign in.</p>
          <form onSubmit={addCoach}>
            <div className="modal-fields">
              <label>Coach name<input autoComplete="name" maxLength={80} value={name} onChange={(event) => setName(event.target.value)} required /></label>
              <label>Email address<input type="email" autoComplete="email" maxLength={120} value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
              <label className="add-coach-password">Initial password<input type="password" autoComplete="new-password" minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} required /><small>At least 8 characters.</small></label>
            </div>
            {formError && <div className="form-error" role="alert">{formError}</div>}
            <div className="modal-actions">
              <button type="button" className="secondary-button" disabled={busy} onClick={() => setFormOpen(false)}>Cancel</button>
              <button className="primary-button" disabled={busy}>{busy ? "Creating…" : <><Check size={16} /> Create coach account</>}</button>
            </div>
          </form>
        </section>
      </div>}
    </div>
  );
}
