import { useEffect, useState } from "react";
import { Activity, CalendarDays, Clock3, Mail, MapPin, Phone, ShieldCheck, Users } from "lucide-react";
import api, { getAssetUrl, getErrorMessage } from "../api";
import AthleteAvatar from "../components/AthleteAvatar";

function formatEventDate(value) {
  return new Intl.DateTimeFormat("en", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}

export default function AthleteDashboardPage() {
  const [portal, setPortal] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/auth/athlete/me")
      .then(({ data }) => setPortal(data))
      .catch((requestError) => setError(getErrorMessage(requestError)));
  }, []);

  if (error) return <div className="notice-error" role="alert">{error}</div>;
  if (!portal) return <div className="loading-line"><span className="spinner" /> Loading your athlete workspace…</div>;

  const { player, events, performance, teamPlayers, teamPlayerCount, clubAthleteCount, coachProfile } = portal;
  return (
    <div className="athlete-page">
      <section className="athlete-hero">
        <div className="athlete-hero-copy">
          <div className="eyebrow"><span className="eyebrow-line" /> YOUR ATHLETE SPACE</div>
          <h1>Hey, {player.name.split(" ")[0]}<span className="heading-period">.</span></h1>
          <p>Your team, your schedule, your next step. You're right where you need to be.</p>
        </div>
        <div className="athlete-hero-emblem"><Activity size={27} /><span>IN THE GAME</span></div>
      </section>
      <div className="athlete-info-grid">
        <section className="athlete-profile-card">
          <div className="athlete-profile-top"><AthleteAvatar name={player.name} photo={player.photo ? getAssetUrl(player.photo) : ""} className="athlete-monogram" /><span className={`status-pill status-${player.status.toLowerCase().replace(/\s+/g, "-")}`}><i />{player.status}</span></div>
          <div className="section-kicker">YOUR PROFILE</div><h2>{player.name}</h2><p className="athlete-profile-email">{player.email}</p>
          <div className="athlete-facts"><div><span>SPORT</span><strong>{player.sport}</strong></div><div><span>POSITION</span><strong>{player.position || "Team member"}</strong></div><div><span>AGE</span><strong>{player.age}</strong></div></div>
          <div className="athlete-performance">
            <span className="section-kicker">PERFORMANCE RECORD</span>
            <div className="athlete-performance-grid">
              <div><strong>{performance.matchesPlayed}</strong><span>MATCHES</span></div>
              <div><strong>{performance.wins}-{performance.losses}-{performance.draws}</strong><span>W-L-D</span></div>
              <div><strong>{performance.goalsOrPoints}</strong><span>GOALS / POINTS</span></div>
              <div><strong>{performance.attendanceRate === null ? "—" : `${performance.attendanceRate}%`}</strong><span>ATTENDANCE ({performance.attended}/{performance.attendanceRecorded})</span></div>
            </div>
            <small>Stats are calculated from completed events recorded by your coach.</small>
          </div>
        </section>
        <section className="athlete-upnext-card">
          <div className="section-heading"><div><span className="section-kicker">COACH-ASSIGNED EVENTS</span><h2>Your schedule</h2></div><span className="schedule-count">{events.length} {events.length === 1 ? "event" : "events"}</span></div>
          {events.length ? <div className="athlete-event-list">{events.map((event) => (
            <article className="athlete-event" key={event._id}>
              <div className="athlete-event-icon"><CalendarDays size={17} /></div>
              <div className="athlete-event-details"><strong>{event.title}</strong><span><Clock3 size={13} />{formatEventDate(event.date)}</span><span><MapPin size={13} />{event.venue}</span></div>
              <span className="event-type-tag">{event.type}<small>On your roster</small></span>
            </article>
          ))}</div> : <div className="athlete-empty"><CalendarDays size={24} /><strong>No upcoming sessions just yet</strong><span>Your coach's scheduled {player.sport.toLowerCase()} events will show up here.</span></div>}
          <div className="athlete-readonly-note"><ShieldCheck size={15} /> Your coach keeps the team calendar up to date.</div>
        </section>
      </div>
      <section className="athlete-club-card">
        <div className="athlete-club-heading">
          <div className="athlete-team-icon" style={{ "--team-color": player.team?.color || "#c3f53c" }}><Users size={18} /></div>
          <div><span className="section-kicker">YOUR CLUB</span><h2>{player.team?.name || "Club roster"}</h2></div>
          <span className="athlete-club-sport">{player.team?.sport || player.sport}</span>
        </div>
        <div className="athlete-club-stats">
          <div><strong>{teamPlayerCount}</strong><span>ATHLETES IN YOUR TEAM</span></div>
          <div><strong>{clubAthleteCount}</strong><span>ATHLETES IN THE CLUB</span></div>
        </div>
      </section>
      <section className="athlete-coach-card">
        <div className="athlete-coach-card-title"><span className="section-kicker">YOUR COACH</span><span className="schedule-count">{player.team?.name || "Team not assigned"}</span></div>
        <div className="athlete-coach-profile">
          <AthleteAvatar name={coachProfile?.name || player.team?.coach || "Coach"} photo={coachProfile?.photo ? getAssetUrl(coachProfile.photo) : ""} className="athlete-coach-avatar" />
          <div className="athlete-coach-copy">
            <strong>{coachProfile?.name || player.team?.coach || "Coach not assigned yet"}</strong>
            {coachProfile?.email && <a href={`mailto:${coachProfile.email}`}><Mail size={14} />{coachProfile.email}</a>}
            {coachProfile?.phone && <a href={`tel:${coachProfile.phone}`}><Phone size={14} />{coachProfile.phone}</a>}
            {!coachProfile?.photo && <small>{coachProfile?.email ? "Your coach can add a profile photo from their account menu." : "Ask your coach to add their account email to the team details."}</small>}
          </div>
        </div>
      </section>
      {player.team && <section className="athlete-roster-card">
        <div className="section-heading">
          <div><span className="section-kicker">YOUR TEAM</span><h2>Teammates</h2></div>
          <span className="schedule-count">{teamPlayerCount} {teamPlayerCount === 1 ? "member" : "members"}</span>
        </div>
        {teamPlayers.length ? <div className="athlete-roster-list">{teamPlayers.map((teammate) => (
          <article className="athlete-roster-member" key={teammate._id}>
            <AthleteAvatar name={teammate.name} photo={teammate.photo ? getAssetUrl(teammate.photo) : ""} className="athlete-roster-avatar" />
            <div className="athlete-roster-copy"><strong>{teammate.name}{String(teammate._id) === String(player._id) ? " (You)" : ""}</strong><span>{[teammate.position, teammate.sport].filter(Boolean).join(" · ")}</span></div>
            <div className="athlete-roster-contact">
              {teammate.email && <a href={`mailto:${teammate.email}`} aria-label={`Email ${teammate.name}`}><Mail size={14} />Email</a>}
              {teammate.phone && <a href={`tel:${teammate.phone}`} aria-label={`Call ${teammate.name}`}><Phone size={14} />Call</a>}
              {!teammate.email && !teammate.phone && <small>No contact details</small>}
            </div>
          </article>
        ))}</div> : <div className="athlete-empty"><Users size={22} /><strong>No team members to show yet</strong></div>}
        <small className="athlete-roster-note">Contact information is shown only to members of your team.</small>
      </section>}
      <div className="athlete-footer-note"><span>SHOW UP. SUPPORT YOUR TEAM. KEEP GETTING BETTER.</span><Activity size={15} /></div>
    </div>
  );
}
