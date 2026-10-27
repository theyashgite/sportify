import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarDays, Check, ChevronDown, CirclePlus, Pencil, Search, Trash2, Users, X } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import api, { getAssetUrl, getErrorMessage } from "../api";
import AthleteAvatar from "./AthleteAvatar";

const configurations = {
  athletes: {
    title: "Athletes", singular: "athlete", endpoint: "/players", icon: Users, description: "Your people, their progress, all in one place.",
    fields: [
      { name: "name", label: "Full name", required: true },
      { name: "email", label: "Email", type: "email" },
      { name: "phone", label: "Phone", type: "tel" },
      { name: "photo", label: "Profile photo", type: "image" },
      { name: "sport", label: "Sport", required: true, placeholder: "e.g. Football" },
      { name: "position", label: "Position", placeholder: "e.g. Forward" },
      { name: "age", label: "Age", type: "number", min: 5, max: 100, required: true },
      { name: "team", label: "Team", type: "team" },
      { name: "status", label: "Status", type: "select", options: ["Active", "Injured", "On leave"] }
    ],
    columns: ["Athlete", "Performance", "Sport / position", "Team", "Portal access", "Age", "Status"]
  },
  teams: {
    title: "Teams", singular: "team", endpoint: "/teams", icon: Users, description: "Keep every squad and coach moving in the same direction.",
    fields: [
      { name: "name", label: "Team name", required: true },
      { name: "sport", label: "Sport", required: true },
      { name: "coach", label: "Coach" },
      { name: "coachEmail", label: "Coach email", type: "email" },
      { name: "coachPhone", label: "Coach phone", type: "tel" },
      { name: "color", label: "Team colour", type: "color" }
    ],
    columns: ["Team", "Sport", "Coach", "Athletes"]
  },
  events: {
    title: "Schedule", singular: "event", endpoint: "/events", icon: CalendarDays, description: "Every practice, match and milestone—planned together.",
    fields: [
      { name: "title", label: "Event name", required: true },
      { name: "sport", label: "Sport", type: "sport", required: true },
      { name: "type", label: "Event type", type: "select", options: ["Training", "Match", "Tournament"] },
      { name: "venue", label: "Venue", required: true },
      { name: "date", label: "Date and time", type: "datetime-local", required: true },
      { name: "status", label: "Status", type: "select", options: ["Scheduled", "Completed", "Cancelled"] },
      { name: "result", label: "Match result", type: "select", options: ["Not recorded", "Win", "Loss", "Draw"], default: "Not recorded" },
      { name: "participants", label: "Select athletes", type: "players" }
    ],
    columns: ["Event", "Sport / type", "Venue", "Date & time", "Players", "Status"]
  }
};

function inputDate(value) {
  if (!value) return "";
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

function displayDate(value) {
  return value ? new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(value)) : "—";
}

function initialForm(fields, record) {
  const form = Object.fromEntries(fields.map((field) => {
    const { name, type } = field;
    let value = record?.[name];
    if (name === "team") value = record?.team?._id || "";
    if (name === "participants") value = record?.participants?.map((player) => player._id) || [];
    if (type === "datetime-local") value = inputDate(value);
    if (type === "color") value = value || "#c3f53c";
    return [name, value ?? field.default ?? (name === "status" || name === "type" ? field.options?.[0] || "Active" : "")];
  }));
  if (fields.some((field) => field.name === "participants")) {
    form.performance = (record?.performance || []).map((entry) => ({
      player: String(entry.player?._id || entry.player),
      attendance: entry.attendance || "Not recorded",
      score: entry.score ?? 0
    }));
  }
  return form;
}

function syncPerformance(participantIds, performance) {
  const existing = new Map((performance || []).map((entry) => [String(entry.player), entry]));
  return participantIds.map((player) => existing.get(String(player)) || ({
    player: String(player),
    attendance: "Not recorded",
    score: 0
  }));
}

function PhotoPicker({ photo, file, onChange, onFileChange }) {
  const [preview, setPreview] = useState("");
  useEffect(() => {
    if (!file) {
      setPreview("");
      return undefined;
    }
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);
  return <div className="photo-picker">
    <AthleteAvatar name="Athlete" photo={preview || (photo ? getAssetUrl(photo) : "")} className="photo-preview" />
    <div className="photo-picker-actions">
      <label className="secondary-button photo-upload-button">
        {file || photo ? "Change photo" : "Choose photo"}
        <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => {
          onFileChange(event.target.files?.[0] || null);
          event.target.value = "";
        }} />
      </label>
      <small>JPG, PNG or WebP · up to 5 MB</small>
      {(photo || file) && <button type="button" className="photo-remove" onClick={() => { onFileChange(null); onChange(""); }}>Remove photo</button>}
      {file && <small>Photo will upload when you save.</small>}
    </div>
  </div>;
}

function ParticipantPicker({ players, form, setForm }) {
  const [search, setSearch] = useState("");
  const searchTerm = search.trim().toLowerCase();
  const selectedWithoutAccounts = players.filter((player) =>
    (form.participants || []).includes(player._id) && !player.hasAccount
  ).length;
  const visiblePlayers = players.filter((player) =>
    [player.name, player.sport, player.position, player.team?.name]
      .some((value) => value?.toLowerCase().includes(searchTerm))
  );

  return <div className="participant-picker">
    <span className="participant-count">All {players.length} athletes · {(form.participants || []).length} selected</span>
    <label className="participant-search"><Search size={14} /><input aria-label="Search athletes for this event" placeholder="Search all athletes…" value={search} onChange={(event) => setSearch(event.target.value)} /></label>
    <div className="participant-options">
      {visiblePlayers.map((player) => {
        const matchesSport = Boolean(form.sport) &&
          player.sport.trim().toLowerCase() === form.sport.trim().toLowerCase();
        const participants = (form.participants || []).includes(player._id)
          ? (form.participants || []).filter((id) => id !== player._id)
          : [...(form.participants || []), player._id];
        return (
        <label className="participant-option" key={player._id}>
          <input type="checkbox" disabled={!matchesSport} checked={(form.participants || []).includes(player._id)} onChange={() => setForm({
            ...form,
            participants,
            performance: syncPerformance(participants, form.performance)
          })} />
          <AthleteAvatar name={player.name} photo={player.photo ? getAssetUrl(player.photo) : ""} className="participant-avatar" />
          <span className="participant-copy"><strong>{player.name}</strong><small>{player.team?.name || player.position || "Unassigned team"} · {player.sport}</small></span>
          <span className={matchesSport ? `portal-pill ${player.hasAccount ? "portal-linked" : "portal-invite"}` : "portal-pill portal-missing"}><i />{matchesSport ? player.hasAccount ? "Portal active" : "Needs portal signup" : form.sport ? "Different sport" : "Choose sport"}</span>
        </label>
      );})}
      {!visiblePlayers.length && <span className="participant-empty">No athletes match your search.</span>}
      {!players.length && <span className="participant-empty">Add athlete profiles before creating an event roster.</span>}
      {players.length > 0 && form.sport && !players.some((player) => player.sport.trim().toLowerCase() === form.sport.trim().toLowerCase()) && <span className="participant-empty">No athletes currently play {form.sport}. Choose a sport that matches an athlete profile to add participants.</span>}
    </div>
    {selectedWithoutAccounts > 0 && <span className="participant-empty" role="status">Selected athlete{selectedWithoutAccounts === 1 ? "" : "s"} need to create an athlete portal login with the email on their profile before they can see this event.</span>}
  </div>;
}

function SportPicker({ players, teams, form, setForm }) {
  const sports = [...new Set([
    ...teams.map((team) => team.sport.trim()),
    ...players.map((player) => player.sport.trim()),
    form.sport?.trim()
  ].filter(Boolean))].sort((first, second) => first.localeCompare(second));

  return <span className="select-wrap"><select required value={form.sport} onChange={(event) => {
    const sport = event.target.value;
    const participants = (form.participants || []).filter((id) =>
      players.some((player) => player._id === id && player.sport.trim().toLowerCase() === sport.trim().toLowerCase())
    );
    setForm({
      ...form,
      sport,
      participants,
      performance: syncPerformance(participants, form.performance)
    });
  }}><option value="">Choose a sport</option>{sports.map((sport) => <option value={sport} key={sport}>{sport}</option>)}</select><ChevronDown size={15} /></span>;
}

function TeamPicker({ teams, form, setForm }) {
  const matchingTeams = teams.filter((team) =>
    team.sport.trim().toLowerCase() === (form.sport || "").trim().toLowerCase() ||
    team._id === form.team
  );

  return <span className="select-wrap"><select value={form.team} onChange={(event) => setForm({ ...form, team: event.target.value })}><option value="">Unassigned</option>{matchingTeams.map((team) => <option value={team._id} key={team._id}>{team.name} · {team.sport}</option>)}</select><ChevronDown size={15} /></span>;
}

function PerformanceEditor({ players, form, setForm }) {
  const selectedPlayers = (form.participants || []).map((id) => players.find((player) => player._id === id)).filter(Boolean);
  const performance = new Map((form.performance || []).map((entry) => [String(entry.player), entry]));

  function update(playerId, changes) {
    setForm({
      ...form,
      performance: syncPerformance(form.participants || [], form.performance).map((entry) =>
        entry.player === playerId ? { ...entry, ...changes } : entry
      )
    });
  }

  return <div className="performance-editor modal-field-label">
    <span>Attendance and goals / points</span>
    {!selectedPlayers.length ? <span className="participant-empty">Select athletes to enter their event records.</span> : selectedPlayers.map((player) => {
      const entry = performance.get(player._id) || { attendance: "Not recorded", score: 0 };
      return <div className="performance-entry" key={player._id}>
        <strong>{player.name}</strong>
        <label>Attendance<select aria-label={`${player.name} attendance`} value={entry.attendance} onChange={(event) => update(player._id, { attendance: event.target.value })}>
          <option>Not recorded</option><option>Present</option><option>Absent</option>
        </select></label>
        <label>Goals / points<input aria-label={`${player.name} goals or points`} type="number" min="0" max="10000" step="1" value={entry.score} onChange={(event) => update(player._id, { score: Number(event.target.value) })} /></label>
      </div>;
    })}
    <small className="performance-help">Only completed events with recorded attendance count toward the athlete record.</small>
  </div>;
}

function Modal({ config, record, teams, players, onClose, onSaved }) {
  const [form, setForm] = useState(() => initialForm(config.fields, record));
  const [photoFile, setPhotoFile] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const payload = { ...form };
    if (payload.age !== undefined && payload.age !== "") payload.age = Number(payload.age);
    if (payload.team === "") payload.team = null;
    if (Array.isArray(payload.participants)) payload.participants = [...new Set(payload.participants)];
    if (Array.isArray(payload.performance)) payload.performance = payload.performance.map((entry) => ({ ...entry, score: Number(entry.score) }));
    if (payload.type === "Training") payload.result = "Not recorded";
    if (payload.date) payload.date = new Date(payload.date).toISOString();
    try {
      if (photoFile) {
        const body = new FormData();
        body.append("photo", photoFile);
        const { data } = await api.post("/uploads/athlete-photo", body, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        payload.photo = data.photo;
      }
      if (record) await api.patch(`${config.endpoint}/${record._id}`, payload);
      else await api.post(config.endpoint, payload);
      await onSaved();
      onClose();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setBusy(false);
    }
  }

  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="edit-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="modal-header"><div><span className="section-kicker">{record ? "UPDATE RECORD" : "NEW RECORD"}</span><h2 id="modal-title">{record ? "Edit" : "Add"} {config.singular}</h2></div><button type="button" className="icon-button" aria-label="Close" onClick={onClose}><X size={19} /></button></div>
      <form onSubmit={submit}><div className="modal-fields">
        {config.fields.map((field) => {
          if (field.name === "result" && (form.status !== "Completed" || !["Match", "Tournament"].includes(form.type))) return null;
          if (field.type === "players") return <div className="modal-field-label" key={field.name}><span>{field.label}</span><ParticipantPicker players={players} form={form} setForm={setForm} /></div>;
          if (field.type === "image") return <div className="modal-field-label" key={field.name}><span>{field.label}</span><PhotoPicker photo={form.photo} file={photoFile} onFileChange={setPhotoFile} onChange={(photo) => setForm({ ...form, photo })} /></div>;
          return <label className={field.type === "color" ? "color-field" : ""} key={field.name}>{field.label}
            {field.type === "select" ? <span className="select-wrap"><select required={field.required} value={form[field.name]} onChange={(event) => {
              const value = event.target.value;
              setForm({ ...form, [field.name]: value, ...(field.name === "type" && value === "Training" ? { result: "Not recorded" } : {}) });
            }}>{field.options.map((option) => <option key={option}>{option}</option>)}</select><ChevronDown size={15} /></span>
              : field.type === "sport" && config.singular === "event" ? <SportPicker players={players} teams={teams} form={form} setForm={setForm} />
                : field.type === "team" ? <TeamPicker teams={teams} form={form} setForm={setForm} />
                  : <input type={field.type || "text"} value={form[field.name]} required={field.required} min={field.min} max={field.max} maxLength={field.type === "text" || !field.type ? 120 : undefined} placeholder={field.placeholder} onChange={(event) => {
                    const value = event.target.value;
                    if (field.name === "sport" && config.singular === "event") {
                      const participants = form.participants.filter((id) => players.some((player) => player._id === id && player.sport.trim().toLowerCase() === value.trim().toLowerCase()));
                      setForm({ ...form, sport: value, participants, performance: syncPerformance(participants, form.performance) });
                    } else if (field.name === "sport" && config.singular === "athlete") {
                      setForm({ ...form, sport: value, team: teams.some((team) => team._id === form.team && team.sport.trim().toLowerCase() === value.trim().toLowerCase()) ? form.team : "" });
                    } else {
                      setForm({ ...form, [field.name]: value });
                    }
                  }} />}
          </label>;
        })}
        {config.singular === "event" && form.status === "Completed" && <PerformanceEditor players={players} form={form} setForm={setForm} />}
      </div>{error && <div className="form-error" role="alert">{error}</div>}<div className="modal-actions"><button type="button" className="secondary-button" onClick={onClose}>Cancel</button><button className="primary-button" disabled={busy}>{busy ? "Saving…" : <><Check size={16} /> {record ? "Save changes" : `Add ${config.singular}`}</>}</button></div></form>
    </section>
  </div>;
}

function StatusPill({ value }) {
  const status = String(value || "Scheduled").toLowerCase().replace(/\s+/g, "-");
  return <span className={`status-pill status-${status}`}><i />{value}</span>;
}

function PerformanceSummary({ performance }) {
  if (!performance || !performance.attendanceRecorded) return <span className="muted-text">No completed event records</span>;
  return <div className="performance-summary">
    <strong>{performance.matchesPlayed} MP · {performance.wins}-{performance.losses}-{performance.draws} W-L-D</strong>
    <small>{performance.goalsOrPoints} G/P · Attendance {performance.attendanceRate}% ({performance.attended}/{performance.attendanceRecorded})</small>
  </div>;
}

function Row({ config, record, onEdit, onDelete }) {
  if (config.singular === "athlete") return <tr><td><div className="person-cell"><AthleteAvatar name={record.name} photo={record.photo ? getAssetUrl(record.photo) : ""} className="person-avatar" /><div><strong>{record.name}</strong><small>{record.email || "No email added"}</small></div></div></td><td><PerformanceSummary performance={record.performance} /></td><td><strong>{record.sport}</strong><small className="cell-sub">{record.position || "—"}</small></td><td>{record.team ? <span className="team-chip"><i style={{ backgroundColor: record.team.color }} />{record.team.name}</span> : <span className="muted-text">Unassigned</span>}</td><td><span className={`portal-pill ${record.hasAccount ? "portal-linked" : record.email ? "portal-invite" : "portal-missing"}`}><i />{record.hasAccount ? "Connected" : record.email ? "Invite ready" : "Add email"}</span></td><td>{record.age}</td><td><StatusPill value={record.status} /></td><td><Actions onEdit={onEdit} onDelete={onDelete} /></td></tr>;
  if (config.singular === "team") return <tr><td><div className="team-name-cell"><span className="team-color" style={{ backgroundColor: record.color }} /><strong>{record.name}</strong></div></td><td>{record.sport}</td><td>{record.coach || <span className="muted-text">Not assigned</span>}</td><td><span className="count-pill">{record.playerCount || 0} athletes</span></td><td><Actions onEdit={onEdit} onDelete={onDelete} /></td></tr>;
  return <tr><td><div className="event-name-cell"><span className="event-mini-icon"><CalendarDays size={16} /></span><strong>{record.title}</strong></div></td><td><strong>{record.sport}</strong><small className="cell-sub">{record.type}</small></td><td>{record.venue}</td><td>{displayDate(record.date)}</td><td><div className="event-roster"><span className="count-pill">{record.participants?.length || 0} athletes</span><small title={record.participants?.map((player) => player.name).join(", ") || "No athletes assigned"}>{record.participants?.length ? record.participants.map((player) => player.name).join(", ") : "No athletes assigned"}</small></div></td><td><StatusPill value={record.status} /></td><td><Actions onEdit={onEdit} onDelete={onDelete} /></td></tr>;
}

function Actions({ onEdit, onDelete }) {
  return <div className="row-actions"><button className="icon-button" aria-label="Edit record" onClick={onEdit}><Pencil size={15} /></button><button className="icon-button delete-action" aria-label="Delete record" onClick={onDelete}><Trash2 size={15} /></button></div>;
}

export default function ManagementPage({ resource }) {
  const config = configurations[resource];
  const [searchParams] = useSearchParams();
  const [records, setRecords] = useState([]);
  const [teams, setTeams] = useState([]);
  const [players, setPlayers] = useState([]);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      const [{ data }, teamsResponse, playersResponse] = await Promise.all([
        api.get(config.endpoint),
        resource === "athletes" ? api.get("/teams") : Promise.resolve({ data: [] }),
        resource === "events" ? api.get("/players") : Promise.resolve({ data: [] })
      ]);
      setRecords(data);
      if (resource === "athletes") setTeams(teamsResponse.data);
      if (resource === "events") setPlayers(playersResponse.data);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, [config.endpoint, resource]);

  useEffect(() => { load(); }, [load]);
  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    const eventView = resource === "events" ? searchParams.get("view") : null;
    const now = new Date();
    return records.filter((record) => {
      const matchesSearch = !needle || JSON.stringify(record).toLowerCase().includes(needle);
      const matchesEventView = !eventView ||
        (eventView === "upcoming" && record.status === "Scheduled" && new Date(record.date) >= now) ||
        (eventView === "completed" && record.status === "Completed");
      return matchesSearch && matchesEventView;
    });
  }, [records, resource, search, searchParams]);
  const eventView = resource === "events" ? searchParams.get("view") : null;
  const pageTitle = eventView === "upcoming" ? "Upcoming events" : eventView === "completed" ? "Completed events" : config.title;
  const pageDescription = eventView === "upcoming"
    ? "See scheduled events that are still to come."
    : eventView === "completed"
      ? "Review completed events and recorded results."
      : config.description;

  async function deleteRecord(record) {
    if (!window.confirm(`Delete ${record.name || record.title}? This cannot be undone.`)) return;
    setNotice("");
    try {
      await api.delete(`${config.endpoint}/${record._id}`);
      setNotice(`${config.singular[0].toUpperCase()}${config.singular.slice(1)} deleted.`);
      await load();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    }
  }

  return <div className="management-page">
    <div className="management-heading"><div><div className="eyebrow"><span className="eyebrow-line" /> CLUB DIRECTORY</div><h1>{pageTitle}<span className="heading-period">.</span></h1><p>{pageDescription}</p></div><button className="primary-button" onClick={() => setModal({ record: null })}><CirclePlus size={17} /> Add {config.singular}</button></div>
    <div className="directory-card">
      <div className="directory-toolbar"><div className="directory-count"><span className="directory-icon"><config.icon size={17} /></span><div><strong>{records.length} {records.length === 1 ? config.singular : `${config.singular}s`}</strong><small>In your club workspace</small></div></div><label className="search-box"><Search size={16} /><input placeholder={`Search ${config.title.toLowerCase()}…`} value={search} onChange={(event) => setSearch(event.target.value)} /><kbd>⌘ K</kbd></label></div>
      {notice && <div className="success-banner"><Check size={15} />{notice}<button aria-label="Dismiss message" onClick={() => setNotice("")}><X size={14} /></button></div>}
      {error && <div className="form-error directory-error" role="alert">{error}<button aria-label="Dismiss error" onClick={() => setError("")}><X size={14} /></button></div>}
      {loading ? <div className="table-loading"><span className="spinner" /> Loading {config.title.toLowerCase()}…</div> : filtered.length ? <div className="table-scroll"><table><thead><tr>{config.columns.map((column) => <th key={column}>{column}</th>)}<th><span className="sr-only">Actions</span></th></tr></thead><tbody>{filtered.map((record) => <Row key={record._id} config={config} record={record} onEdit={() => setModal({ record })} onDelete={() => deleteRecord(record)} />)}</tbody></table></div> : <div className="empty-state"><div className="empty-icon"><config.icon size={23} /></div><h3>{search ? "No matches found" : `Your ${config.title.toLowerCase()} list is ready`}</h3><p>{search ? "Try another name or keyword." : `Add your first ${config.singular} and start building your club workspace.`}</p>{!search && <button className="secondary-button" onClick={() => setModal({ record: null })}><CirclePlus size={16} /> Add {config.singular}</button>}</div>}
      <div className="directory-footer"><span>Showing <strong>{filtered.length}</strong> of <strong>{records.length}</strong> records</span><span>SPORTIFY CLUB DIRECTORY <i>✳</i></span></div>
    </div>
    {modal && <Modal config={config} record={modal.record} teams={teams} players={players} onClose={() => setModal(null)} onSaved={load} />}
  </div>;
}
