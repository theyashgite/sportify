import { useEffect, useState } from "react";
import { Activity, ArrowDownRight, ArrowRight, ArrowUpRight, CalendarDays, Clock3, Plus, Users, HeartPulse } from "lucide-react";
import { Link } from "react-router-dom";
import api, { getErrorMessage } from "../api";

function formatDate(value, options = { month: "short", day: "numeric" }) {
  return new Intl.DateTimeFormat("en", options).format(new Date(value));
}

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/dashboard").then(({ data: result }) => setData(result)).catch((requestError) => setError(getErrorMessage(requestError)));
  }, []);

  if (error) return <div className="notice-error" role="alert">{error}</div>;
  if (!data) return <div className="loading-line"><span className="spinner" /> Loading your club overview…</div>;

  const { stats, upcomingEvents } = data;
  const cards = [
    { label: "Total athletes", value: stats.athletes, detail: "Across all your teams", icon: Users, tone: "lime", to: "/athletes" },
    { label: "Active teams", value: stats.teams, detail: "Ready to compete", icon: Activity, tone: "violet", to: "/teams" },
    { label: "Upcoming events", value: stats.upcomingEvents, detail: "On your club calendar", icon: CalendarDays, tone: "blue", to: "/events" },
    { label: "Athletes in action", value: stats.activePlayers, detail: `${stats.injuredPlayers} currently recovering`, icon: HeartPulse, tone: "peach", to: "/athletes" }
  ];

  return (
    <div className="dashboard-page">
      <div className="welcome-row"><div><div className="eyebrow"><span className="eyebrow-line" /> YOUR CLUB AT A GLANCE</div><h1>Make today <span>count.</span></h1><p>Here’s what’s happening with your club. Keep the momentum going.</p></div><Link className="primary-button" to="/events"><Plus size={17} /> Plan an event</Link></div>
      <div className="stats-grid">{cards.map(({ label, value, detail, icon: Icon, tone, to }, index) => (
        <Link to={to} className="stat-card" key={label} style={{ animationDelay: `${index * 70}ms` }}>
          <div className="stat-top"><span className={`stat-icon icon-${tone}`}><Icon size={19} /></span><span className="stat-trend">{index === 3 ? <ArrowDownRight size={14} /> : <ArrowUpRight size={14} />} CLUB</span></div>
          <div className="stat-value">{value}</div><div className="stat-label">{label}</div><div className="stat-detail">{detail}</div>
        </Link>
      ))}</div>
      <div className="dashboard-columns">
        <section className="surface-card events-card">
          <div className="section-heading"><div><span className="section-kicker">UP NEXT</span><h2>On the calendar</h2></div><Link className="text-link" to="/events">Full schedule <ArrowRight size={15} /></Link></div>
          {upcomingEvents.length ? <div className="event-list">{upcomingEvents.map((event, index) => (
            <div className="event-row" key={event._id}><div className={`event-date event-tone-${index % 3}`}><strong>{formatDate(event.date, { day: "2-digit" })}</strong><span>{formatDate(event.date, { month: "short" }).toUpperCase()}</span></div><div className="event-info"><strong>{event.title}</strong><span>{event.sport} <i>·</i> {event.venue}</span></div><span className="event-kind"><Clock3 size={13} />{event.type}</span></div>
          ))}</div> : <div className="empty-inline"><CalendarDays size={24} /><strong>Nothing on the calendar yet</strong><span>Add your first session or match to get started.</span><Link to="/events">Create an event <ArrowRight size={14} /></Link></div>}
        </section>
        <aside className="focus-card"><div className="focus-decoration">✳</div><span className="section-kicker">THE CLUB PLAYBOOK</span><h2>Small steps.<br /><em>Big seasons.</em></h2><p>Great clubs are built one practice, one teammate, one moment at a time.</p><div className="focus-divider" /><div className="focus-bottom"><div className="focus-icon"><Activity size={17} /></div><span>Your season, in sync.</span><span className="focus-mark">S.</span></div></aside>
      </div>
      <div className="bottom-note"><span className="note-check">✓</span> Your workspace is connected and up to date. <span className="bottom-note-right">MADE TO MOVE <span>✳</span></span></div>
    </div>
  );
}
