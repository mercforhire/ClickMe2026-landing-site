// api/subscribe.js
// ClickMe marketing site -- waitlist capture endpoint (Phase 4, FORM-03..FORM-09)
//
// A Vercel Function using the Web Standard fetch export -- zero imports, zero
// require calls, no package.json anywhere in this repo. Vercel's own docs
// describe this exact shape in a plain .js file under /api as needing no
// additional configuration; adding a package.json here, for any reason,
// would give this project its first npm dependency surface for nothing.
//
// This function is the only tier holding a credential, and it writes to a
// table with no SELECT grant at all -- see sql/waitlist.sql's header. That
// means every failure mode below (a bad address, a rejected write, a
// missing environment variable) must resolve to the failure page and never
// to a reported success, because nothing downstream can ever read the
// table back to notice a mistake made here.

export default {
  async fetch(request) {
    if (request.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    try {
      const form = await request.formData();

      const company = (form.get("company") || "").toString();
      const rawEmail = (form.get("email") || "").toString();
      const source = (form.get("source") || "").toString();
      const audience = (form.get("audience") || "").toString();

      // A filled honeypot means a bot, not a visitor -- and a bot that gets
      // an error here learns which field gave it away. Routing it to the
      // same confirmation page a real signup gets, while writing nothing,
      // is what makes the trap invisible instead of merely present (D-07).
      if (company.trim() !== "") {
        // The Location below is deliberately relative, not absolute: the browser
        // resolves it against the URL it actually posted to, so a POST to
        // /clickme/api/subscribe yields /clickme/waitlist-confirmed.html while a
        // POST to /api/subscribe yields /waitlist-confirmed.html -- whichever Host
        // the parent's rewrite forwards becomes irrelevant to correctness. That is
        // also why every site below builds its response by hand rather than
        // calling Response's static redirect helper, which parses its argument
        // against an API base URL that does not exist server-side and throws on a
        // relative string. A second, supporting reason: this site's own CSP sets
        // form-action 'self', and an absolute Location pointing at the
        // *.vercel.app host would be blocked by that policy on a redirect target
        // in Chrome and Safari (Firefox is a documented exception).
        return new Response(null, { status: 303, headers: { Location: "../waitlist-confirmed.html" } });
      }

      // The live policy's WITH CHECK rejects a non-lowercase address
      // rather than normalizing it, and this key has no SELECT grant with
      // which to ever notice a signup silently lost that way -- so this
      // step is load-bearing, not cosmetic.
      const email = rawEmail.trim().toLowerCase();

      const emailOk = email.length > 0 && email.length <= 255 && email.includes("@");
      const sourceOk = source === "hero" || source === "closing";
      const audienceOk = audience === "client" || audience === "expert";

      if (!emailOk || !sourceOk || !audienceOk) {
        return new Response(null, { status: 303, headers: { Location: "../waitlist-error.html" } });
      }

      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY;

      // Phase 6 sets these two names as Production-scoped Vercel
      // environment variables. Until then this branch fires on every
      // request, and that is the correct behavior, not a bug to chase.
      if (!supabaseUrl || !supabaseKey) {
        return new Response(null, { status: 303, headers: { Location: "../waitlist-error.html" } });
      }

      // Only Prefer: return=minimal is sent, with no query string. Any
      // Prefer: resolution= value selects PostgREST's upsert path, which
      // this table's column-level grant does not carry the privileges for
      // and rejects outright -- proven live against the real table, and
      // overturning what earlier planning had assumed.
      const res = await fetch(supabaseUrl + "/rest/v1/waitlist", {
        method: "POST",
        headers: {
          apikey: supabaseKey,
          Authorization: "Bearer " + supabaseKey,
          "Content-Type": "application/json",
          Prefer: "return=minimal"
        },
        // Built from three named variables, never spread from the form --
        // the column-level grant rejects a statement naming any other
        // column outright, and this is what keeps that unreachable rather
        // than merely unlikely.
        body: JSON.stringify({ email: email, source: source, audience: audience })
      });

      if (res.status === 201) {
        return new Response(null, { status: 303, headers: { Location: "../waitlist-confirmed.html" } });
      }

      if (res.status === 409) {
        let duplicateBody = null;
        try {
          duplicateBody = await res.json();
        } catch (parseError) {
          duplicateBody = null;
        }
        // A 409 only means "already on the list" when its body carries
        // code 23505. Any other code is a real conflict, not a duplicate,
        // and must not be waved through as success.
        if (duplicateBody && duplicateBody.code === "23505") {
          return new Response(null, { status: 303, headers: { Location: "../waitlist-confirmed.html" } });
        }
      }

      // Everything else lands here, including a policy rejection. A
      // failed write reported as success is the one outcome nothing
      // downstream could ever detect, since this key cannot read the
      // table back -- so the default here is failure, not success.
      return new Response(null, { status: 303, headers: { Location: "../waitlist-error.html" } });
    } catch (error) {
      // Covers a missing-env-var throw during URL construction, a refused
      // connection, and anything else unforeseen -- an uncaught throw here
      // would otherwise hand the response to Vercel's own error page,
      // outside this project's design and outside its CSP.
      return new Response(null, { status: 303, headers: { Location: "../waitlist-error.html" } });
    }
  }
};
