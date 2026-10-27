# Sportify — Sports Club Management PoC

Sportify is a full-stack MERN proof of concept for a campus sports club, with separate administrator, coach/management and athlete experiences. Administrators get a dedicated oversight workspace for coach registrations, team assignments and unlinked teams; coaches alone manage club records and schedules; athletes sign in to view their own profile, team and upcoming events for their sport.

## Rubric alignment

| Assessment area | What this project demonstrates |
| --- | --- |
| Problem definition & PoC planning | A club administrator or coach needs one place to manage squads, athletes and events. This PoC focuses on those core workflows. |
| React front end | Reusable layouts, role-protected routes, coach and athlete sign-in/registration, searchable CRUD directories, responsive design and request/error states. |
| Node.js & Express | Role-protected REST routes, authentication middleware, JSON parsing, security headers, validation and centralized error responses. |
| MongoDB integration | Mongoose models for users, teams, athletes and events, with CRUD operations and a one-to-one athlete-account reference. |
| End-to-end data flow | Coaches assign athletes to teams and select event participants. Athletes see only events whose roster includes their linked profile. |
| Functionality | Separate admin coach oversight and coach-only athlete/team/event management, per-event athlete rosters, and an athlete portal showing only assigned events. |
| Testing & validation | Required fields and model constraints, invalid IDs, duplicate accounts, invalid credentials, protected routes, delete safeguards and production build. |
| Code quality & documentation | Separated client/server, reusable UI components, explicit API errors, environment-based configuration and setup steps below. |

## Stack

- **Client:** React 18, Vite, React Router, Axios, Lucide icons
- **API:** Node.js, Express 5, Mongoose
- **Database:** MongoDB Community Server or MongoDB Atlas
- **Authentication:** bcrypt password hashing, signed JWT bearer tokens and role-based authorization

## Get started

Requirements: Node.js 20+, npm, and a running MongoDB instance (local or Atlas).

1. Install all workspace dependencies from the project root:

   ```bash
   npm install
   ```

2. Copy `server/.env.example` to `server/.env` and set your MongoDB URI, a long random JWT secret, and admin details. For example:

   ```env
   PORT=5000
   MONGODB_URI=mongodb://127.0.0.1:27017/sportify
   JWT_SECRET=use-a-long-random-value-here
   CLIENT_ORIGIN=http://localhost:5173,http://127.0.0.1:5173
   ADMIN_NAME=Sportify Admin
   ADMIN_EMAIL=admin@example.com
   ADMIN_PASSWORD=choose-a-password-of-8-characters-or-more
   ```

   For Atlas, use the connection string from your own cluster as `MONGODB_URI`. Keep `server/.env` private; it is ignored by Git.

### Move existing local MongoDB data to Atlas

1. Create an Atlas cluster, a dedicated database user with read/write access, and add your current IP address to the project IP access list. Atlas account email alone does not authorize a database connection.
2. Keep `MONGODB_URI` pointing to local MongoDB while migrating. Add the Atlas **Drivers** connection string to `ATLAS_MONGODB_URI` in `server/.env`. Do not paste database passwords into source code, documentation, or chat.
3. Stop the app while copying. Preview the source counts and confirm the Atlas database is empty:

   ```bash
   npm run migrate:atlas
   ```

4. Start the migration only after reviewing the dry-run counts:

   ```bash
   npm run migrate:atlas -- --apply
   ```

   The migration preserves MongoDB document IDs and relationships, copies indexes, verifies collection counts, and refuses to overwrite collections already in Atlas. If copying fails, newly created destination collections are removed where possible; local data is never changed.
5. After a successful migration, set `MONGODB_URI` in `server/.env` to the same Atlas URI and restart `npm run dev`. Verify the app sign-in, teams, athlete portal and event rosters before relying on Atlas.

3. Create the first admin account and sample teams, athletes and events:

   ```bash
   npm run seed
   ```

   Seeding is safe to re-run: it does not overwrite an existing admin or duplicate the sample records. Your sign-in credentials are `ADMIN_EMAIL` and `ADMIN_PASSWORD` from `server/.env`.

4. Start the API and Vite development server:

   ```bash
   npm run dev
   ```

   Open **http://localhost:5173**. Choose Administrator at **http://localhost:5173/login** or sign in directly at **http://localhost:5173/admin/login** using the seeded `ADMIN_EMAIL` and `ADMIN_PASSWORD`. Coach/manager and athlete login are also selected at `/login`; athlete registration is at **http://localhost:5173/athlete/register**. The API health check is **http://localhost:5000/api/health**.

If login reports that the API cannot be reached, confirm `npm run dev` started both the API and client. When using MongoDB Atlas, the API must be allowed by the Atlas project's **Network Access** IP access list; add the current server IP and restart the app. Check the API startup output for MongoDB connection errors. Do not use an unrestricted IP rule as a workaround.

An athlete account can only be created after a manager adds an athlete profile with that athlete's email address. The Athletes table shows whether portal access is connected, ready for signup, or missing an email. Then the athlete uses that same email to create their login. The registration process links the new account to the existing athlete profile, so athletes cannot claim or view someone else's record. After seeding, for example, register `ananya@example.com` at `/athlete/register` with a new password to try the athlete portal.

Coaches can record attendance and each athlete's goals or points when marking an event completed, and set the result for matches and tournaments. The Athletes directory and each athlete's portal show the calculated matches played, win-loss-draw record, goals/points and attendance percentage. Events with no attendance recorded are excluded from these totals.

Coaches can also upload a JPG, PNG or WebP athlete profile photo (up to 5 MB) while adding or editing an athlete. The photo appears in the Athletes directory, athlete portal and event participant picker. Photos are stored in `server/uploads`; keep that folder backed up alongside MongoDB data. Local disk uploads are intended for local/persistent server storage and are not preserved by ephemeral hosting.

Team settings can include the coach's contact email and phone. The athlete portal displays the athlete's team roster size, total club athletes, and the assigned team's coach contact details. Athletes can see a roster of their own teammates, with available email and phone links; those contacts are visible only to members of that team. Add athlete contact details in the athlete form and coach contact details in the team form.

Coaches and administrators can upload or change their account profile photo from the account area at the bottom of the sidebar. To show the coach photo in an athlete's portal, set the team's coach email to the same email address used by that coach's account. Administrators have a distinct oversight dashboard and Coach Oversight page showing registered coach accounts, team and athlete assignments, and teams whose coach email is not linked to a registered coach account. Open a coach from the directory to see their account details, assigned athlete rosters and events linked to those athletes. Admins can create a coach login for their club from Coach Oversight by setting the coach's name, email and initial password; share that password securely. Coach-only athlete, team, schedule and dashboard APIs reject administrator accounts.

The sidebar's **Need a hand?** card opens a role-based help center with expandable step-by-step instructions for coaches adding club data and athletes understanding how their portal works.

When creating an event, choose a sport from the existing team/athlete sports. The searchable participant picker shows the **full athlete roster**; athletes in other sports remain visible but cannot be selected, and matching-sport athletes can be added to the event.

To build the client for production, run `npm run build`. Start the API with `npm start` after configuring its environment.

## MongoDB storage model

Mongoose creates these collections in the database named by `MONGODB_URI`:

- **clubs** — club name, unique coach invite code, owner, timestamps.
- **users** — name, unique normalized email, bcrypt-hashed password, `admin`/`coach`/`athlete` role, required `club` ObjectId reference, timestamps. Password is excluded from normal queries.
- **teams** — required `club` reference, name, sport, coach, display color, timestamps.
- **players** — required `club` reference, name, optional email, sport, position, age, status, a `team` ObjectId reference to `teams`, and an optional unique `user` reference to the athlete's login account.
- **events** — required `club` reference, title, sport, type, venue, date, status, selected athlete ObjectId references in `participants`, timestamps.

The browser never connects directly to MongoDB. It sends a JWT in the authorization header to the Express API. The API verifies the token, checks the account role, validates the request and uses Mongoose to read/write MongoDB. An athlete's `team` reference is chosen by the coach; an event's `participants` references the roster selected by the coach for that event. The event form filters athletes by sport and the API validates each selection. The athlete portal finds its profile using the signed-in account and returns only upcoming events whose participant list includes that athlete. The API prevents deletion of a team that still has assigned athletes; removing an athlete removes their linked login and event-roster references.

## API overview

All paths are prefixed by `/api`. The health check and authentication endpoints are public; dashboard, team, player and event endpoints require a valid bearer token.

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/health` | API health |
| POST | `/auth/register` | Create a coach account |
| POST | `/auth/athlete/register` | Link an athlete account to a pre-created athlete profile |
| POST | `/auth/login` | Sign in and receive a JWT |
| GET | `/auth/me` | Get the signed-in account |
| GET | `/auth/athlete/me` | Athlete's own profile, team and assigned upcoming events |
| GET | `/clubs/me` | Get this coach's club name, invite code and coach list |
| GET | `/dashboard` | Club counts and next scheduled events |
| GET, POST | `/teams`, `/players`, `/events` | List/create records; event creation can include selected athlete IDs in `participants` |
| PATCH, DELETE | `/{id}` on each collection | Update/delete a record |

## PoC boundaries

Coach registration lets a coach create a club or join one with its invite code. Every user, athlete, team and event is stored with a MongoDB club reference; management APIs filter and validate records against the signed-in coach's club. Coaches can view the club name and share its invite code from the sidebar. Athlete registration requires a matching, unclaimed athlete profile first, and athlete accounts can access only their own read-only portal. The API assigns existing unscoped records and accounts to a single "Existing Sportify Club" during startup, preserving their current shared workspace; new coaches must join that club with its invite code to see those records. The seed script creates the administrator account and sample club data. This is an academic proof of concept, not a production deployment: production use should add rate limiting, email verification/password recovery, audit logging and automated API/UI test suites. Use a strong private JWT secret and a MongoDB account with only the required database permissions.

> The supplied rubric also asks for five signatures from Div C, D and E. Add genuine signatures to the submission copy as instructed by your course; the application does not fabricate them.
