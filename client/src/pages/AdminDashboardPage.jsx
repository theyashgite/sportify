import { useEffect, useMemo, useState } from "react";
import { Activity, ArrowRight, CalendarDays, ShieldCheck, Users } from "lucide-react";
import { Link } from "react-router-dom";
import api, { getErrorMessage } from "../api";

function formatDate(value) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

export default function AdminDashboardPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/clubs/coaches")
      .then(({ data: result }) => setData(result))
      .catch((requestError) => setError(getErrorMessage(requestError)));
  }, []);

  const recentCoaches = useMemo(
    () => [...(data?.coaches || [])].sort((first, second) => new Date(second.joinedAt) - new Date(first.joinedAt)).slice(0, 4),
    [data]
  );

  if (error) return <div className="notice-error" role="alert">{error}</div>;
  if (!data) return <div className="loading-line"><span className="spinner" /> Loading administrator overview…</div>;

  const assignedTeams = data.coaches.reduce((total, coach) => total + coach.teams.length, 0);
  const assignedAthletes = data.coaches.reduce((total, coach) => total + coach.athleteCount, 0);
  const summaryCards = [
    { label: "Coach accounts", value: data.coaches.length, detail: "Registered in this club", icon: Users, tone: "lime" },
    { label: "Teams with a coach", value: assignedTeams, detail: "Linked to a registered coach", icon: Activity, tone: "violet" },
    { label: "Athletes on coached teams", value: assignedAthletes, detail: "Across assigned team rosters", icon: ShieldCheck, tone: "blue" },
    { label: "Teams needing review", value: data.unassignedTeams.length, detail: "No registered coach linked", icon: CalendarDays, tone: "peach" }
  ];

  return (
    <div className="admin-dashboard">
      <div className="welcome-row">
        <div><div className="eyebrow"><span className="eyebrow-line" /> ADMINISTRATOR WORKSPACE</div><h1>Club oversight<span>.</span></h1><p>Track coach registrations, team assignments and athlete coverage across your club.</p></div>
        <Link className="primary-button" to="/coaches"><Users size={16} /> Manage coaches</Link>
      </div>
      <div className="stats-grid admin-stats-grid">{summaryCards.map(({ label, value, detail, icon: Icon, tone }, index) => (
        <article className="stat-card" key={label} style={{ animationDelay: `${index * 70}ms` }}>
          <div className="stat-top"><span className={`stat-icon icon-${tone}`}><Icon size={19} /></span><span className="stat-trend">CLUB</span></div>
          <div className="stat-value">{value}</div><div className="stat-label">{label}</div><div className="stat-detail">{detail}</div>
        </article>
      ))}</div>
      <div className="dashboard-columns admin-dashboard-columns">
        <section className="surface-card events-card admin-recent-card">
          <div className="section-heading"><div><span className="section-kicker">RECENT REGISTRATIONS</span><h2>Latest coaches</h2></div><Link className="text-link" to="/coaches">All coaches <ArrowRight size={15} /></Link></div>
          {recentCoaches.length ? <div className="admin-recent-list">{recentCoaches.map((coach) => (
            <div className="admin-recent-row" key={coach.id}><div className="coach-directory-avatar">{coach.name.trim().charAt(0).toUpperCase()}</div><div className="admin-recent-copy"><strong>{coach.name}</strong><a href={`mailto:${coach.email}`}>{coach.email}</a></div><span className="coach-joined">Joined {formatDate(coach.joinedAt)}</span></div>
          ))}</div> : <div className="empty-inline"><Users size={24} /><strong>No coach accounts yet</strong><span>Registered coaches will appear here.</span></div>}
        </section>
        <section className="surface-card admin-review-card">
          <div className="section-heading"><div><span className="section-kicker">ASSIGNMENT CHECK</span><h2>Teams to review</h2></div><Link className="text-link" to="/coaches">Coach directory <ArrowRight size={15} /></Link></div>
          {data.unassignedTeams.length ? <div className="admin-unassigned-list">{data.unassignedTeams.slice(0, 5).map((team) => (
            <div className="admin-unassigned-row" key={team.id}><div><strong>{team.name}</strong><span>{team.sport} · {team.athletes} {team.athletes === 1 ? "athlete" : "athletes"}</span></div><small>{team.hasUnregisteredCoach ? "Coach not registered" : "No coach assigned"}</small></div>
          ))}</div> : <div className="empty-inline"><ShieldCheck size={24} /><strong>All teams are linked</strong><span>Every team has a registered coach account assigned.</span></div>}
          {data.unassignedTeams.length > 5 && <Link className="text-link admin-review-link" to="/coaches">See all {data.unassignedTeams.length} teams <ArrowRight size={15} /></Link>}
        </section>
      </div>
    </div>
  );
}
