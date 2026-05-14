# Public Locum Calendar MVP Gap Review

This MVP now has the core public-calendar shape: a practice can share a live-looking booking link, visitors can browse available dated locum/staff shifts, and a request is added for practice review. It intentionally stays apply-to-approve rather than instant booking.

## What is working in the MVP

- Public booking links at `/book/:shareSlug` for each practice.
- Role filtering, month calendar browsing, open-shift detail, and request submission.
- Practice dashboard and sidebar entry points for the shareable calendar.
- Requests flow into the existing in-memory application list so practices can review and confirm.

## What is still demo-only

- Data is held in the client demo store, so requests do not persist across reloads or devices.
- The public page feels live, but it is not realtime across browsers yet.
- Requesters are created from form details without authentication, email verification, CV upload, or document checks.
- Booking conflict checks are still UI/store-level and not protected by a database transaction.
- The share link uses seeded practice slugs, not a managed publish/unpublish flow.

## Production gaps before a real launch

- Add persistent storage for practices, locations, shifts, applications, bookings, locums, documents, availability, and audit timestamps.
- Add authentication and authorization for practice admins, locums, staff users, and public requesters.
- Enforce booking rules server-side, including overlapping confirmed shifts, filled positions, cancelled shifts, and stale public requests.
- Add realtime updates or at least refetch/polling after mutations so open dates disappear when shifts are filled.
- Add notifications for new requests, confirmations, cancellations, timesheet events, and missing documents.
- Add file handling for CVs, insurance, right-to-work, RCVS/RVN registration evidence, and practice-visible document names.
- Add environment config for app base URL, database URL, auth/session secret, email provider, storage provider, and deployment target.
- Add production deployment checks, monitoring, error logging, backup strategy, and privacy/security review.

## Cal.diy lessons to carry forward

- Cal.diy is a useful reference for self-hosting discipline: database migrations, env files, public URL configuration, and optional calendar integrations.
- Do not copy the full Cal.diy architecture into this repo yet. Its Next.js/Postgres/Prisma workspace, app store, cron jobs, OAuth apps, API services, and integration setup are too heavy for this MVP.
- Keep `.ics` export as the first calendar bridge. Google/Outlook sync should come later after auth, persistence, token storage, and failure recovery are in place.

## Recommended next build step

Move the demo store behind a real server persistence layer. Supabase is the fastest fit if the goal is a working shared MVP with Postgres, row-level security, realtime subscriptions, and storage; a custom Postgres setup is better if the product needs tighter control from day one.
