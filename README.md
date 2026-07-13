# Trekking Management Application (V2)

Flask REST API backend + Vue.js 3 frontend (CDN, no build step) + SQLite + Redis caching + Celery background jobs.

## Roles
- **Admin** — pre-created (`admin@trek.com` / `admin123`). Manages treks, creates staff accounts, blacklists users/staff, views reports.
- **Trek Staff** — created directly by Admin (no self-registration). Manages assigned treks and participants.
- **User (Trekker)** — self-registers. Browses/books treks, views history, exports booking history as CSV.

## Project Structure
```
trekking_v2/
  backend/
    app.py            # Flask app factory, blueprint registration, admin seeding
    config.py          # Config (SQLite, Redis, Celery)
    extensions.py       # SQLAlchemy instance
    models.py          # User, Trek, Booking models
    cache_utils.py      # Redis cache helpers (safe no-op if Redis is down)
    celery_app.py       # Celery instance + beat schedule
    tasks.py           # Celery tasks: daily reminders, monthly report, CSV export
    routes/            # auth, admin, staff, user, trek, booking blueprints
    requirements.txt
  frontend/
    index.html          # Entry point, loads Vue 3 + Vue Router via CDN
    css/style.css
    js/
      api.js            # fetch() wrapper for backend API
      store.js          # reactive session store
      router.js         # Vue Router with role-based route guards
      app.js            # mounts the app
      components/       # one file per page/view
```

## Running Locally

**No `npm install` or Node.js needed** — the Vue.js frontend is loaded directly via CDN (`<script>` tags in `index.html`) using native ES modules. There is no build step; Flask serves the `frontend/` folder as static files directly.

You need **4 terminals** (Flask app, Redis server, Celery worker, Celery beat):

```bash
cd backend
pip install -r requirements.txt

# Terminal 1:[wsl] Redis (required for caching + Celery broker/backend)
redis-server

# Terminal 2:[power shell] Flask app
cd backend
python app.py
# -> visit http://127.0.0.1:5000

# Terminal 3:[command prompt] Celery worker (handles the CSV export job triggered from the UI)
# On Windows, the default "prefork" pool crashes (billiard/WinError 6) — use --pool=solo
cd backend 
.\venv\Scripts\activate.bat
python -m celery -A celery_app.celery worker --loglevel=info --pool=solo

# Terminal 4:[command prompt] Celery beat (triggers the daily reminder + monthly report on schedule)
#celery -A celery_app.celery beat --loglevel=info
cd backend
.\venv\Scripts\activate.bat
python -m celery -A celery_app.celery beat --loglevel=info
```

The app still works for browsing/booking/admin actions even if Redis/Celery aren't running — caching and the export button will just show an error until they're up.

## Sending Real Emails (Daily Reminders + Monthly Report)

SMTP credentials are **already pre-filled** in `backend/config.py` (Gmail account provided). You don't need to set any environment variables to send real email — it should work out of the box.

**Before running the full app, verify the credentials work with the standalone test script:**
```bash
cd backend
python test_email.py your-test-address@example.com
```
If it prints `SUCCESS`, everything is configured correctly. If it fails, check:
- The Gmail account has 2-Step Verification enabled and the password used is a 16-character **App Password** (not the normal Gmail password) — generate one at https://myaccount.google.com/apppasswords
- Your network/firewall allows outbound connections to `smtp.gmail.com:587`

To use a different email account instead, override these in your terminal before running Celery:
```bash
# Windows PowerShell:
$env:SMTP_USER="youraddress@gmail.com"
$env:SMTP_PASSWORD="your-16-char-app-password"
$env:ADMIN_EMAIL="admin-inbox@example.com"   # where the monthly report goes
```

## Notes on the Celery Jobs

- **Daily reminders**: runs at 8:00 AM daily (via Celery beat). Sends a reminder for any `Open` trek whose `start_date` falls within the **next 3 days** (configurable via `REMINDER_WINDOW_DAYS` in `config.py`) — not just exactly "tomorrow" — so treks a few days out still get reminders ahead of time. Each booking is only reminded **once** (tracked via a `reminder_sent` flag), so re-running the job doesn't spam duplicate emails. To test it immediately:
  1. In Admin → Treks, create/edit a trek with `start_date` within the next 3 days and status `Open`.
  2. Book that trek as a user.
  3. Manually run: `cd backend && python -c "import tasks; print(tasks.send_daily_reminders.run())"`
- **Monthly report**: runs on the 1st of each month at 6:00 AM, emails `ADMIN_EMAIL` an HTML summary directly — there is **no admin-panel page for it**, it only arrives via email (also kept as a backup file in `backend/reports/` in case the mail fails, but this is not exposed anywhere in the UI).
- **CSV export**: triggered from User → History page. Fully functional without any SMTP setup — it only needs Redis + a running Celery worker. Files land in `backend/exports/` and are offered as a download once the job completes (frontend polls task status and shows a browser alert).
- **If no email arrives at all**, check your Celery worker/beat terminal output first — `email_utils.py` prints a loud `WARNING: SMTP is NOT configured` banner on startup if credentials are missing, and logs `[email_utils] Email sent to ...` or `[email_utils] FAILED to send to ...` for every attempt — so the terminal itself tells you what happened.

## IMPORTANT: If Upgrading From an Earlier Version of This Project

The `Booking` table gained a new `reminder_sent` column. SQLAlchemy's `db.create_all()` only creates tables that don't exist yet — it does **not** alter existing tables. If you have an old `backend/trekking.db` from a previous version, **delete it** before running this version, so it gets recreated with the correct schema:
```bash
cd backend
rm trekking.db          # macOS/Linux
del trekking.db         # Windows
```
Then restart `python app.py` (it will recreate the DB and re-seed the Admin account automatically).

## Restarting After Any Code Update (Windows gotcha)

Celery worker/beat processes **do not auto-reload** when `tasks.py`, `app.py`, or any backend file changes — they keep running old, cached code in memory. After pulling a new version of this project (or making any backend edit), you must **stop and restart all 4 terminals** (Redis can usually stay running, but Flask, Celery worker, and Celery beat must be restarted):
1. Ctrl+C in the Flask, worker, and beat terminals
2. Delete `backend/trekking.db` if the models changed (see above)
3. Restart in order: Flask → Celery worker → Celery beat

## Database
Created programmatically via SQLAlchemy (`db.create_all()` in `app.py`). No manual DB Browser usage. Admin user is seeded automatically on first run.

## Changelog (Final Review Pass)

A full function-by-function audit was done using real Redis + a real Celery worker (not mocked), plus a 55-check automated test suite covering every backend route. The following real bugs were found and fixed:

1. **SMTP hang bug**: `smtplib.SMTP()` had no timeout, so a slow/unreachable mail server could freeze the entire Celery worker indefinitely (especially bad with `--pool=solo`, which is single-threaded and required on Windows) — one stuck email would block every task queued behind it. Fixed by adding `timeout=10` to the SMTP connection.
2. **Staff unassignment bug**: Setting a trek's staff to "-- None --" in the Admin edit form stored an empty string in the `staff_id` column instead of `NULL`. Fixed in `routes/admin.py`.
3. **IDOR security gap**: Any logged-in Trekker could potentially download another user's exported CSV by guessing/enumerating the filename, since the download route didn't verify ownership. Fixed by validating the requesting user's session against the file/task owner in `routes/user.py`.
4. **Crash on bad query param**: `/api/treks?duration=<non-numeric>` caused an unhandled `ValueError` (500 error). Fixed with a try/except in `routes/trek.py`.
5. **Frontend polling leak**: The CSV export status poller (`UserHistory.js`) never stopped if a user navigated away mid-export or if the job never completed (e.g., worker not running) — it would poll forever in the background. Fixed with a `beforeUnmount` cleanup hook and a 60-second max-attempt cap.

All fixes were verified with real Redis + a real Celery worker process (not just mocked/unit tests), including running all 3 Celery tasks back-to-back to confirm the worker never hangs.

## Changelog (Round 2)

6. **CSV export popup-blocker fix**: The export flow used to call `window.open()` automatically once the background job finished. Browsers treat that as a popup (since it fires from an async polling callback, not a direct click) and silently block it — the file was created successfully on the server, but nothing visibly happened for the user. Fixed: the User → History page now shows a clickable **"Download CSV"** button once the export is ready, which always works since it's a genuine user click.
7. **Trek status not auto-updating on creation**: The "Add New Trek" form has "Assign Staff" and "Status" fields, but the backend was silently ignoring both and always hardcoding new treks to `Pending` — so assigning staff at creation time had no effect; you had to go edit the trek afterward just to open it. Fixed: `POST /api/admin/treks` now reads `staff_id` from the request, and if staff is assigned at creation time, the trek's status is automatically set to `Open` right away (no staff assigned → stays `Pending`, as before).
8. **Trek status simplified to 4 values everywhere**: Removed `Approved` as a trek status option (it was a redundant intermediate step). The full trek lifecycle is now just: `Pending → Open → Closed / Completed`, consistently in the Admin trek form and the Staff trek-management dropdown. (Note: this is separate from `User.status`, which still uses `Approved`/`Blacklisted`/`Pending` for staff/user account approval — that's a different, unrelated concept and was left unchanged.)
- `Trek.staff_id` → `User.id` (a trek is assigned to one staff member)
- `Booking.user_id` → `User.id`, `Booking.trek_id` → `Trek.id` (many-to-many between users and treks via bookings)
