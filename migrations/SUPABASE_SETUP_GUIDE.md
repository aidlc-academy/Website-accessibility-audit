# Supabase database setup

These SQL migrations create the AccessLens `audits` and `users` tables. They
are safe to run more than once. The current app still uses local SQLite for
audits and local file-based authentication; running these migrations creates
the cloud schema but does not switch the app to Supabase.

## Create the tables

1. Create or open a project at [Supabase](https://supabase.com/).
2. In the project dashboard, open **SQL Editor** and create a new query.
3. Copy and run all of [`001_initial_schema.sql`](./001_initial_schema.sql).
4. Create a second query, copy and run all of
   [`002_add_users_auth.sql`](./002_add_users_auth.sql).
5. In **Table Editor**, confirm that `audits` and `users` exist.

`audits` stores each scan, its configuration and findings, scan statistics,
report filename, comparison link, and optional owner. `users` stores
backend-managed account records, including bcrypt password hashes. The second
migration adds `user_id` to `audits` and links it to `users`.

Both tables have Row Level Security enabled and deny direct access to
`anon` and Supabase `authenticated` roles. This app uses its own Express JWT
authentication, not Supabase Auth, so all database access must go through a
trusted backend using `SUPABASE_SERVICE_ROLE_KEY`. Never put that key in
frontend code or commit it.

## App integration status

The active app currently uses `data/audits.sqlite` and file-based local account
storage. The existing `server/supabaseStorage.js` is not selected by the
active storage adapter. Therefore, creating these tables does not migrate
existing records or make the live app read/write Supabase. Do not follow
legacy `STORAGE_MODE` instructions or expose the service-role key in the
browser. Supabase runtime integration and data migration require a separate
backend change.
