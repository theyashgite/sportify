import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Activity, ArrowRight, CalendarDays, Camera, Check, ChevronDown, CircleHelp, Copy, LayoutDashboard, LogOut, Menu, Users, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import api, { getAssetUrl, getErrorMessage } from "../api";
import AthleteAvatar from "./AthleteAvatar";

function CoachProfileModal({ user, updateProfile, onClose }) {
  const [photoFile, setPhotoFile] = useState(null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [preview, setPreview] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!photoFile) {
      setPreview("");
      return undefined;
    }
    const objectUrl = URL.createObjectURL(photoFile);
    setPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [photoFile]);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      let photo = removePhoto ? "" : user.photo || "";
      if (photoFile) {
        const body = new FormData();
        body.append("photo", photoFile);
        const { data } = await api.post("/uploads/profile-photo", body, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        photo = data.photo;
      }
      await updateProfile({ photo });
      onClose();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setBusy(false);
    }
  }

  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="edit-modal coach-profile-modal" role="dialog" aria-modal="true" aria-labelledby="coach-profile-title">
      <div className="modal-header">
        <div><span className="section-kicker">COACH PROFILE</span><h2 id="coach-profile-title">Help athletes recognize you</h2></div>
        <button type="button" className="icon-button" aria-label="Close" onClick={onClose}><X size={19} /></button>
      </div>
      <form onSubmit={submit}>
        <div className="coach-profile-identity">
          <AthleteAvatar name={user.name} photo={preview || (!removePhoto && user.photo ? getAssetUrl(user.photo) : "")} className="coach-profile-avatar" />
          <div><strong>{user.name}</strong><span>{user.email}</span></div>
        </div>
        <label className="coach-profile-upload">
          <Camera size={16} />Choose profile photo
          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => {
            const file = event.target.files?.[0] || null;
            if (file && file.size > 5 * 1024 * 1024) {
              setError("Photo must be 5 MB or smaller.");
              event.target.value = "";
              return;
            }
            setError("");
            setPhotoFile(file);
            setRemovePhoto(false);
            event.target.value = "";
          }} />
        </label>
        <small className="coach-profile-hint">JPG, PNG or WebP · up to 5 MB. Your photo will appear in your athletes' team portal.</small>
        {(user.photo || photoFile) && !removePhoto && <button type="button" className="photo-remove" onClick={() => { setPhotoFile(null); setRemovePhoto(true); }}>Remove current photo</button>}
        {error && <div className="form-error" role="alert">{error}</div>}
        <div className="modal-actions">
          <button type="button" className="secondary-button" onClick={onClose}>Cancel</button>
          <button className="primary-button" disabled={busy || (!photoFile && !(removePhoto && user.photo))}>{busy ? "Saving…" : <><Check size={16} /> Save profile</>}</button>
        </div>
      </form>
    </section>
  </div>;
}

function HelpCenterModal({ isAthlete, onClose }) {
  useEffect(() => {
    function closeOnEscape(event) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  const helpTopics = isAthlete
    ? [
      { title: "How is my performance calculated?", steps: ["Your coach marks an event Completed and records your attendance.", "Matches played and W-L-D count when you are marked Present for a match or tournament.", "Goals/points add up from completed events where you were Present. Attendance is Present events divided by recorded Present and Absent events."] },
      { title: "How do I contact a teammate?", steps: ["Your team roster shows athletes on your team who play the same sport.", "Choose Email or Call beside a teammate. These buttons appear only when the coach has added that contact detail."] },
      { title: "Why can’t I see an event?", steps: ["Your coach must add you to the event roster.", "Only upcoming, scheduled events assigned to your athlete profile appear here. Ask your coach to check the event if it is missing."] }
    ]
    : [
      { title: "How do I add an athlete?", steps: ["Open Athletes and choose Add athlete.", "Enter the athlete’s name, sport, age and any available email or phone.", "Choose a profile photo if you have one, assign a same-sport team, then save.", "For athlete portal access, add their email first so they can register with that same address."] },
      { title: "How do I set up a team and coach contacts?", steps: ["Open Teams and choose Add team, or edit an existing team.", "Enter the team name and sport. Add the coach’s name, account email and phone.", "Assign athletes to that team from each athlete’s profile. Keep their sport matched to the team."] },
      { title: "How do I invite another coach to my club?", steps: ["Click your club name at the top of the sidebar.", "Copy the club invite code and send it to the coach you trust.", "They choose Join an existing club while registering and enter that code. They will then share this club’s athletes, teams and events."] },
      { title: "How do I schedule an event?", steps: ["Open Schedule and choose Add event.", "Enter the event name, sport, type, venue and date/time.", "Select athletes who play that sport, then save. Edit the event later to update its roster or details."] },
      { title: "How do I record attendance and results?", steps: ["Edit the event and change its status to Completed.", "Set each selected athlete’s attendance and goals/points in the performance section.", "For a Match or Tournament, choose the overall Win, Loss or Draw result, then save.", "Athlete records update from completed events with recorded attendance; only Present athletes count as having played."] },
      { title: "How do I add a coach profile photo?", steps: ["Click your account name at the bottom of the sidebar.", "Choose a JPG, PNG or WebP photo up to 5 MB, then save your profile.", "Make sure the team’s Coach email matches your login email so athletes can see your photo."] }
    ];

  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="edit-modal help-center-modal" role="dialog" aria-modal="true" aria-labelledby="help-center-title">
      <div className="modal-header">
        <div><span className="section-kicker">{isAthlete ? "ATHLETE HELP" : "CLUB WORKSPACE HELP"}</span><h2 id="help-center-title">Need a hand?</h2></div>
        <button type="button" className="icon-button" aria-label="Close help center" onClick={onClose}><X size={19} /></button>
      </div>
      <p className="help-center-intro">{isAthlete ? "How your team portal works—without repeating the information already on your page." : "Step-by-step instructions for adding information and updating your club."}</p>
      <div className="help-guide-list">
        {helpTopics.map((topic) => <details className="help-guide" key={topic.title}>
          <summary><strong>{topic.title}</strong><ChevronDown size={15} /></summary>
          <ol>{topic.steps.map((step) => <li key={step}>{step}</li>)}</ol>
        </details>)}
      </div>
      <div className="help-center-footer"><CircleHelp size={15} /><span>{isAthlete ? "If something looks wrong, ask your coach to check your team assignment or event record." : "These guides explain how to add and update information in your workspace."}</span></div>
    </section>
  </div>;
}

function ClubDetailsModal({ clubData, error, onClose }) {
  const [copyMessage, setCopyMessage] = useState("");

  async function copyInviteCode() {
    try {
      await navigator.clipboard.writeText(clubData.club.inviteCode);
      setCopyMessage("Invite code copied.");
    } catch {
      setCopyMessage("Copy is unavailable. Select the code and copy it manually.");
    }
  }

  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="edit-modal club-details-modal" role="dialog" aria-modal="true" aria-labelledby="club-details-title">
      <div className="modal-header">
        <div><span className="section-kicker">SHARED CLUB WORKSPACE</span><h2 id="club-details-title">{clubData?.club.name || "Your club"}</h2></div>
        <button type="button" className="icon-button" aria-label="Close club details" onClick={onClose}><X size={19} /></button>
      </div>
      {error && <div className="form-error" role="alert">{error}</div>}
      {clubData && <>
        <p className="club-details-intro">Share this invite code with trusted coaches. Anyone who joins with it will share this club’s athletes, teams and events.</p>
        <div className="club-invite-panel"><span>COACH INVITE CODE</span><strong>{clubData.club.inviteCode}</strong><button type="button" className="secondary-button" onClick={copyInviteCode}><Copy size={15} /> Copy code</button></div>
        {copyMessage && <small className="club-copy-message" role="status">{copyMessage}</small>}
        <div className="club-coach-list"><span className="section-kicker">CLUB COACHES</span>
          {clubData.coaches.map((coach) => <div key={coach.email}><strong>{coach.name}</strong><span>{coach.email}{coach.role === "admin" ? " · Admin" : ""}</span></div>)}
        </div>
      </>}
      <div className="modal-actions"><button type="button" className="secondary-button" onClick={onClose}>Close</button></div>
    </section>
  </div>;
}

const managementLinks = [
  { to: "/", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/athletes", label: "Athletes", icon: Users, children: [{ path: "/athletes", label: "All athletes" }] },
  { to: "/teams", label: "Teams", icon: Activity, children: [{ path: "/teams", label: "All teams" }] },
  {
    to: "/events",
    label: "Schedule",
    icon: CalendarDays,
    children: [
      { path: "/events", label: "All events" },
      { path: "/events", label: "Upcoming", view: "upcoming" },
      { path: "/events", label: "Completed", view: "completed" }
    ]
  }
];

const managementTitles = { "/": "Overview", "/athletes": "Athletes", "/teams": "Teams", "/events": "Schedule", "/coaches": "Coaches" };

export default function AppShell() {
  const { user, logout, updateProfile } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [clubOpen, setClubOpen] = useState(false);
  const [clubData, setClubData] = useState(null);
  const [clubError, setClubError] = useState("");
  const [expandedMenu, setExpandedMenu] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const isAthlete = user?.role === "athlete";
  const isAdmin = user?.role === "admin";
  useEffect(() => {
    if (isAthlete || !user) {
      setClubData(null);
      return;
    }
    api.get("/clubs/me")
      .then(({ data }) => {
        setClubData(data);
        setClubError("");
      })
      .catch((requestError) => setClubError(getErrorMessage(requestError)));
  }, [isAthlete, user?.id]);
  const title = isAthlete
    ? "My athlete portal"
    : isAdmin && location.pathname === "/"
      ? "Admin overview"
      : location.pathname.startsWith("/coaches/")
        ? "Coach profile"
        : managementTitles[location.pathname] || "Sportify";
  const links = isAthlete
    ? [{ to: "/athlete", label: "My portal", icon: LayoutDashboard, end: true }]
    : isAdmin
      ? [{ to: "/", label: "Admin overview", icon: LayoutDashboard, end: true }, { to: "/coaches", label: "Coach oversight", icon: Users }]
      : managementLinks;
  useEffect(() => {
    const activeGroup = links.find((link) => link.children?.some((child) =>
      location.pathname === child.path &&
      (child.view ? new URLSearchParams(location.search).get("view") === child.view : !new URLSearchParams(location.search).has("view"))
    ));
    setExpandedMenu(activeGroup?.label || null);
  }, [location.pathname, location.search, user?.role]);

  function signOut() {
    logout();
    navigate("/login");
  }

  return (
    <div className="app-shell">
      <aside className={`sidebar ${menuOpen ? "sidebar-open" : ""}`}>
        <div className="brand"><span className="brand-mark"><Activity size={21} strokeWidth={2.5} /></span><span>sportify<span className="brand-period">.</span></span></div>
        <button type="button" className="club-switcher" onClick={() => setClubOpen(true)} disabled={isAthlete}>
          <div className="club-avatar">{clubData?.club.name?.[0]?.toUpperCase() || "S"}</div>
          <div><strong>{isAthlete ? "Athlete portal" : clubData?.club.name || "Loading club…"}</strong><small>{isAthlete ? "Club member" : isAdmin ? "Administrator workspace" : "Shared coach workspace"}</small></div>
          {!isAthlete && <ChevronDown size={15} />}
        </button>
        <p className="nav-caption">WORKSPACE</p>
        <nav className="main-nav">
          {links.map(({ to, label, icon: Icon, end, children }) => {
            if (children) {
              const selectedChild = children.find((child) =>
                location.pathname === child.path &&
                (child.view ? new URLSearchParams(location.search).get("view") === child.view : !new URLSearchParams(location.search).has("view"))
              );
              const isExpanded = expandedMenu === label;
              return <div className={`nav-group ${isExpanded ? "nav-group-open" : ""}`} key={to}>
                <button
                  type="button"
                  className={`nav-link nav-group-trigger ${selectedChild ? "nav-link-active" : ""}`}
                  aria-expanded={isExpanded}
                  aria-controls={`submenu-${label.toLowerCase()}`}
                  onClick={() => setExpandedMenu(isExpanded ? null : label)}
                >
                  <Icon size={18} strokeWidth={1.9} /><span>{label}</span>{label === "Schedule" && <span className="nav-dot" />}
                  <ChevronDown className="nav-group-chevron" size={15} />
                </button>
                {isExpanded && <div className="nav-submenu" id={`submenu-${label.toLowerCase()}`}>
                  {children.map((child) => {
                    const childActive = location.pathname === child.path &&
                      (child.view ? new URLSearchParams(location.search).get("view") === child.view : !new URLSearchParams(location.search).has("view"));
                    const childTo = child.view ? `${child.path}?view=${child.view}` : child.path;
                    return <NavLink
                      key={child.label}
                      to={childTo}
                      end
                      onClick={() => setMenuOpen(false)}
                      className={`nav-submenu-link ${childActive ? "nav-submenu-link-active" : ""}`}
                    >{child.label}</NavLink>;
                  })}
                </div>}
              </div>;
            }
            return <NavLink key={to} to={to} end={end} onClick={() => setMenuOpen(false)} className={({ isActive }) => `nav-link ${isActive ? "nav-link-active" : ""}`}>
              <Icon size={18} strokeWidth={1.9} /><span>{label}</span>{label === "Schedule" && <span className="nav-dot" />}
            </NavLink>;
          })}
        </nav>
        <div className="sidebar-bottom">
          <button className="help-card help-card-button" onClick={() => setHelpOpen(true)} aria-haspopup="dialog">
            <span className="help-icon"><CircleHelp size={17} /></span><strong>Need a hand?</strong><p>{isAthlete ? "Guides and coach contact." : isAdmin ? "Tips and club oversight guides." : "Tips and quick workspace guides."}</p><ArrowRight size={15} className="help-card-arrow" />
          </button>
          <div className="profile-actions">
          <button className="profile-button" onClick={() => isAthlete ? signOut() : setProfileOpen(true)} aria-label={isAthlete ? "Sign out" : "Open account profile"}>
            <AthleteAvatar name={user?.name || "Sportify"} photo={!isAthlete && user?.photo ? getAssetUrl(user.photo) : ""} className="avatar" />
            <span className="profile-copy"><strong>{user?.name}</strong><small>{user?.role === "admin" ? "Club administrator" : isAthlete ? "Athlete account" : "Coach account"}</small></span>
          </button>
          {!isAthlete && <button className="profile-signout" aria-label="Sign out" onClick={signOut}><LogOut size={16} /></button>}
          </div>
        </div>
      </aside>
      {menuOpen && <button className="mobile-scrim" aria-label="Close navigation" onClick={() => setMenuOpen(false)} />}
      <main className="main-area">
        <header className="topbar">
          <button className="mobile-menu icon-button" aria-label="Open menu" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X size={20} /> : <Menu size={20} />}</button>
          <div className="breadcrumb">Workspace <span>/</span> <strong>{title}</strong></div>
          <div className="topbar-right"><span className="today-label">{new Intl.DateTimeFormat("en", { weekday: "short", month: "short", day: "numeric" }).format(new Date())}</span><div className="topbar-divider" /><div className="topbar-user"><AthleteAvatar name={user?.name || "Sportify"} photo={!isAthlete && user?.photo ? getAssetUrl(user.photo) : ""} className="avatar avatar-small" /><span>{user?.name}</span></div></div>
        </header>
        <section className="page-content"><Outlet /></section>
      </main>
      {profileOpen && <CoachProfileModal user={user} updateProfile={updateProfile} onClose={() => setProfileOpen(false)} />}
      {helpOpen && <HelpCenterModal isAthlete={isAthlete} onClose={() => setHelpOpen(false)} />}
      {clubOpen && <ClubDetailsModal clubData={clubData} error={clubError} onClose={() => setClubOpen(false)} />}
    </div>
  );
}
