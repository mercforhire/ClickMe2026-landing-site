-- sql/waitlist.sql
-- ClickMe marketing site -- waitlist data store (Phase 3, DATA-01..DATA-05)
--
-- Run ONCE, by hand, in the Supabase SQL Editor of the Supabase project
-- that hosts this waitlist. That project MUST NOT be the ClickMe backend's
-- app project, which holds accounts and payment identity (DATA-01). It is
-- permitted to be a project shared with another, non-sensitive site --
-- Supabase's free plan allows only two active projects per account, and
-- that limit is counted across every organization you own or administer,
-- so a second organization does not grant a fresh quota. This file is not
-- a migration and nothing in this repo runs it automatically.
--
-- Because the host project may NOT be a clean slate, this file revokes
-- before it grants. In Settings -> Data API, "Automatically expose new
-- tables" is unchecked by default only for projects created on or after
-- 2026-05-30; an older project may still auto-grant anon full
-- select/insert/update/delete on any table it sees created. The explicit
-- revoke below makes this file correct either way, and the column-level
-- grant near the bottom is the real, deliberate exposure mechanism -- not
-- that checkbox.
--
-- If a table named waitlist already exists in the host project, STOP.
-- Do not drop it. It belongs to the other site, and this table should be
-- renamed to avoid the collision instead.
--
-- Phase 4 forward requirement A: the function must POST plainly and map
-- the duplicate case from the error code. It must NOT send
-- "Prefer: resolution=ignore-duplicates", and it does not need the
-- "?on_conflict=email" query parameter.
--
-- This was established by live probe on 2026-08-22, and it overturns what
-- planning assumed. PostgREST's upsert path -- which any
-- "Prefer: resolution=..." value selects -- needs privileges that the
-- column-level "grant insert (email, source)" below does not confer. Sent
-- against this table, resolution=ignore-duplicates is rejected outright
-- with 42501 "permission denied for table waitlist", exactly as
-- resolution=merge-duplicates would be. Widening the grant to make the
-- upsert path work would hand the caller back control of created_at and
-- unsubscribed_at, which is the whole point of the column-level grant.
--
-- So the function should send only "Prefer: return=minimal" (asking for
-- the row back would require select, which anon does not have), and read
-- the outcome from the status:
--
--     201                    -> a new address was stored. Success.
--     409 with code 23505    -> the address is already on the list, caught
--                               by constraint waitlist_email_unique.
--                               Present this as success too (FORM-08) --
--                               it is not an error the visitor can act on.
--     anything else          -> failure. Send the visitor to the failure
--                               page; never report success for a write
--                               that did not land (FORM-06).
--
-- Phase 4 forward requirement B: the function must lowercase the address
-- before sending it. The policy below rejects a non-lowercase address
-- rather than normalizing it, so forwarding an address unmodified turns
-- a real visitor's signup into an invisible failure -- there is no select
-- access on this key with which to ever notice it happened.
--
-- Changing this file (its columns, constraints, policy or grant) updates
-- the waitlist operator runbook in README.md, in the same commit.

create table public.waitlist (
  id              bigint generated always as identity primary key,
  email           text not null,
  created_at      timestamptz not null default now(),
  source          text not null,
  -- D-17/D-18: which side of the marketplace this signup is on -- 'client'
  -- or 'expert'. Nullable here, with no default, because the concept did
  -- not exist before Phase 4 and the rows Phase 3's probing left behind
  -- have no honest answer to backfill. It is the policy below, not this
  -- column definition, that actually makes an answer mandatory for every
  -- NEW row -- a NULL fails the WITH CHECK's "in" test just like any other
  -- disallowed value would.
  audience        text,
  unsubscribed_at timestamptz,

  -- DATA-03: a plain UNIQUE constraint, not a functional index -- the
  -- stored value and the uniqueness key stay the same thing.
  constraint waitlist_email_unique unique (email),

  -- D-06: a minimal sanity backstop against the directly-reachable
  -- endpoint storing junk or an unbounded string. Deliberately not a
  -- regex -- no regex correctly matches a real address, and a false
  -- rejection here is an invisible lost signup.
  constraint waitlist_email_sane check (
    email = btrim(email)
    and email <> ''
    and position('@' in email) > 0
    and char_length(email) <= 255
  )
);

-- The host project may auto-expose new tables (see the header). Strip any
-- such grant before adding the single narrow one this table is meant to
-- have, so the end state does not depend on how the project was
-- configured. service_role is deliberately untouched: it bypasses RLS by
-- design and is what the dashboard and the operator runbook rely on.
revoke all on public.waitlist from anon, authenticated;

alter table public.waitlist enable row level security;

-- D-02/D-03/D-05: the ONLY policy on this table. No select, update,
-- delete or "for all" policy exists, and none is added for any role
-- other than anon. source is restricted to the two real surfaces that
-- exist today; a non-lowercase address is rejected outright rather than
-- silently rewritten. D-17/D-18: audience is restricted to the same two
-- values the form's radios offer -- and because a NULL fails an "in"
-- test just like any disallowed value would, this clause is what makes
-- audience de-facto mandatory for every new insert, even though the
-- column itself stays nullable for the rows that predate it.
create policy "waitlist_insert_public"
on public.waitlist
for insert
to anon
with check (
  source in ('hero', 'closing')
  and audience in ('client', 'expert')
  and email = lower(email)
);

-- D-02/DATA-04: the actual "the caller cannot set created_at or
-- unsubscribed_at" mechanism. A column-level grant means anon may name
-- only email, source and (as of D-17/D-20) audience in an insert's
-- column list -- naming any other column fails the whole statement
-- outright, before the policy above is even evaluated, whatever value
-- was supplied. This grant stays column-scoped on purpose: widening it
-- to a table-level "grant insert on public.waitlist" would hand the
-- caller back control of created_at and unsubscribed_at, which is the
-- entire point of writing it this way instead. No select, update,
-- delete or blanket grant exists for anon or for authenticated on this
-- table at all -- that is what makes a denied read or delete come back
-- as an unambiguous error instead of a response that only looks like a
-- correct denial. service_role retains its usual access and is expected
-- to: it bypasses RLS by design, and it is what the dashboard uses to
-- honor the unsubscribe and deletion requests described in README.md.
grant insert (email, source, audience) on public.waitlist to anon;

-- ============================================================================
-- IF YOU ALREADY RAN THIS FILE
-- ============================================================================
-- Everything above is the complete, from-scratch definition of this table --
-- what you'd run once, by hand, against a brand-new host project. But this
-- table went live in Phase 3, before the audience column existed, so running
-- the whole file again from the top against that live table fails on its
-- very first line: "create table" errors against a table that's already
-- there. If that's your situation, do not run the statements above -- run
-- exactly the five statements below instead. They are the equivalent change
-- for a table that already exists, and they must never diverge from the
-- from-scratch definition above: if you ever edit one, edit the other in
-- the same sitting.
--
-- The revoke comes before the grant even though the grant only widens (it
-- doesn't strictly need to strip anything first): Postgres's
-- "revoke insert on <table> from <role>" also revokes that role's
-- corresponding column-level insert privileges, so doing the revoke first
-- keeps this pair correct whether or not a previous run already narrowed
-- the grant -- either the revoke clears something and the grant restores a
-- superset, or there was nothing to clear and the grant is still a
-- superset. Either way the end state is exactly
-- "insert (email, source, audience)" and nothing more.
--
-- The drop/create pair below leaves a brief moment with no policy at all on
-- this table. That is safe, not a gap: row level security is already
-- enabled (see above), and a table with RLS on and zero policies denies
-- every insert -- the window fails closed, never open.
--
-- These five statements are also safe to run on a project where the
-- from-scratch statements above were just run for the first time: "add
-- column if not exists" and "drop policy if exists" are both no-ops against
-- a table that already has the column and the identical policy, so running
-- this file start to finish never breaks a fresh install either.

alter table public.waitlist add column if not exists audience text;

revoke insert on public.waitlist from anon;

grant insert (email, source, audience) on public.waitlist to anon;

drop policy if exists "waitlist_insert_public" on public.waitlist;

create policy "waitlist_insert_public"
on public.waitlist
for insert
to anon
with check (
  source in ('hero', 'closing')
  and audience in ('client', 'expert')
  and email = lower(email)
);
