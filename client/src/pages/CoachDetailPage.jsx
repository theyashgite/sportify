import { useEffect, useState } from "react";
import { Activity, ArrowLeft, CalendarDays, Mail, ShieldCheck, Users } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import api, { getAssetUrl, getErrorMessage } from "../api";
import AthleteAvatar from "../components/AthleteAvatar";

function formatDate(value, options = { month: "short", day: "numeric", year: "numeric" }) {
  return new Intl.DateTimeFormat("en", options).format(new Date(value));
}

function EventList({ title, kicker, events, emptyMessage }) {
  return (
    <section className="surface-card coach-detail-section">
      <div className="section-heading"><div><span className="section-kicker">{kicker}</span><h2>{title}</h2></div></div>
      {events.length ? <div className="coach-detail-event-list">{events.map((event) => (
        <article className="coach-detail-event" key={event._id}>
          <div className="coach-detail-event-icon"><CalendarDays size={16} /></div>
          <div className="coach-detail-event-copy"><strong>{event.title}</strong><span>{event.sport} · {event.type} · {event.venue}</span></div>
          <div className="coach-detail-event-meta"><time dateTime={event.date}>{formatDate(event.date, { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })}</time><small>{event.status}</small></div>
        </article>
      ))}</div> : <div className="coach-detail-empty">{emptyMessage}</div>}
    </section>
  );
}

export default function CoachDetailPage() {
  const { coachId } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setData(null);
    setError("");
    api.get(`/clubs/coaches/${coachId}`)
      .then(({ data: result }) => setData(result))
      .catch((requestError) => setError(getErrorMessage(requestError)));
  }, [coachId]);

  if (error) return <div><Link className="role-back-link coach-detail-back" to="/coaches"><ArrowLeft size={15} /> Back to coaches</Link><div className="notice-error" role="alert">{error}</div></div>;
  if (!data) return <div className="loading-line"><span className="spinner" /> Loading coach profile…</div>;

  const { coach, teams, summary, upcomingEvents, recentEvents } = data;

  return (
    <div className="coach-detail-page">
      <Link className="role-back-link coach-detail-back" to="/coaches"><ArrowLeft size={15} /> Back to coaches</Link>
      <section className="coach-detail-hero">
        <AthleteAvatar name={coach.name} photo={coach.photo ? getAssetUrl(coach.photo) : ""} className="coach-detail-avatar" />
        <div className="coach-detail-identity">
          <span className="section-kicker">COACH PROFILE</span>
          <h1>{coach.name}</h1>
          <a href={`mailto:${coach.email}`}><Mail size={14} /> {coach.email}</a>
          <span className="coach-detail-joined">Coach account since {formatDate(coach.joinedAt)}</span>
        </div>
      </section>
      <div className="stats-grid coach-detail-stats">
        <article className="stat-card"><div className="stat-top"><span className="stat-icon icon-violet"><Activity size={18} /></span></div><div className="stat-value">{summary.teamCount}</div><div className="stat-label">Assigned teams</div><div className="stat-detail">Linked using coach account email</div></article>
        <article className="stat-card"><div className="stat-top"><span className="stat-icon icon-lime"><Users size={18} /></span></div><div className="stat-value">{summary.athleteCount}</div><div className="stat-label">Team athletes</div><div className="stat-detail">Across assigned teams</div></article>
        <article className="stat-card"><div className="stat-top"><span className="stat-icon icon-blue"><CalendarDays size={18} /></span></div><div className="stat-value">{summary.eventCount}</div><div className="stat-label">Athlete-linked events</div><div className="stat-detail">{summary.completedEventCount} completed</div></article>
      </div>
      <section className="surface-card coach-detail-section">
        <div className="section-heading"><div><span className="section-kicker">TEAM ASSIGNMENTS</span><h2>Teams and athlete rosters</h2></div></div>
        {teams.length ? <div className="coach-detail-team-list">{teams.map((team) => (
          <article className="coach-detail-team" key={team.id}>
            <div className="coach-detail-team-heading"><div><span className="section-kicker">{team.sport}</span><h3>{team.name}</h3></div><span className="coach-team-count">{team.athletes.length} {team.athletes.length === 1 ? "athlete" : "athletes"}</span></div>
            {team.athletes.length ? <div className="coach-detail-athlete-list">{team.athletes.map((athlete) => (
              <div className="coach-detail-athlete" key={athlete.id}>
                <div><strong>{athlete.name}</strong><span>{athlete.position || athlete.sport}{athlete.email ? ` · ${athlete.email}` : ""}</span></div>
                <span className={`coach-athlete-status ${athlete.status === "Active" ? "status-active" : ""}`}>{athlete.status}</span>
              </div>
            ))}</div> : <p className="coach-detail-empty">No athletes are assigned to this team yet.</p>}
          </article>
        ))}</div> : <div className="coach-detail-empty"><ShieldCheck size={20} /><span>No team is linked to this coach yet. Set the team’s coach email to {coach.email} to connect it.</span></div>}
      </section>
      <div className="coach-detail-event-grid">
        <EventList title="Upcoming events" kicker="SCHEDULE" events={upcomingEvents} emptyMessage="No upcoming scheduled events for this coach’s team athletes." />
        <EventList title="Recent completed events" kicker="ACTIVITY" events={recentEvents} emptyMessage="No completed events found for this coach’s team athletes." />
      </div>
    </div>
  );
}
