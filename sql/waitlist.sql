-- sql/waitlist.sql
-- ClickMe marketing site -- waitlist data store (Phase 3, DATA-01..DATA-05)
--
-- Run ONCE, by hand, in the Supabase SQL Editor of the waitlist's OWN
-- Supabase project -- a project distinct from the backend's app project
-- (DATA-01). This file is not a migration and nothing in this repo runs
-- it automatically.
--
-- Before running: in this project's Settings -> Data API, confirm
-- "Automatically expose new tables" is left UNCHECKED. Checking it would
-- grant anon full select/insert/update/delete on this table -- the grant
-- statement near the bottom of this file is the real, deliberate exposure
-- mechanism, not that checkbox.
--
-- Phase 4 forward requirement A: the function that inserts into this
-- table must send the header "Prefer: resolution=ignore-duplicates"
-- together with the query parameter "?on_conflict=email". This table's
-- primary key is a surrogate identity column that is always fresh on
-- every insert, so ignore-duplicates alone (which matches conflicts
-- against the primary key by default) never finds a conflict there;
-- without on_conflict=email a duplicate address instead raises an
-- ordinary unique violation (HTTP 409) rather than being silently
-- ignored.
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

alter table public.waitlist enable row level security;

-- D-02/D-03/D-05: the ONLY policy on this table. No select, update,
-- delete or "for all" policy exists, and none is added for any role
-- other than anon. source is restricted to the two real surfaces that
-- exist today; a non-lowercase address is rejected outright rather than
-- silently rewritten.
create policy "waitlist_insert_public"
on public.waitlist
for insert
to anon
with check (
  source in ('hero', 'closing')
  and email = lower(email)
);

-- D-02/DATA-04: the actual "the caller cannot set created_at or
-- unsubscribed_at" mechanism. A column-level grant means anon may name
-- only email and source in an insert's column list -- naming either
-- restricted column fails the whole statement outright, before the
-- policy above is even evaluated, whatever value was supplied. No
-- select, update, delete or blanket grant exists for anon on this table
-- at all, and none is granted to any other role either -- that is what
-- makes a denied read or delete come back as an unambiguous error
-- instead of a response that only looks like a correct denial.
grant insert (email, source) on public.waitlist to anon;
