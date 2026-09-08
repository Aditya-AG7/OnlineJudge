# Testing Checklist — Online Judge

Living document. Check items off as verified. Add new items as they come up during the week.
Last updated: Day 3 (AI integration day)

## How to use this
- [ ] = not yet tested
- [x] = tested and confirmed working
- [!] = tested, found a bug — note the bug next to it, fix, then re-test

---

## Day 2 items — Defensive hardening (verify these actually work, don't just trust the plan)

- [ ] Expired/malformed JWT on a protected route → clean 401, not a 500 or hang
      How to test: log in, copy the token, wait for it to expire (or edit a character in it), hit `/profile` or any protected route with it in Postman/Thunder Client
- [ ] `GET /submissions/:id` for a submission belonging to a DIFFERENT user (not admin) → 403, not the data
      How to test: log in as User A, create a submission, note its ID. Log in as User B, request that ID.
- [ ] Zero-test-case problem: what actually happens on Run/Submit?
      How to test: create a problem with no test cases via admin, open it, click Run and Submit, note actual behavior (message shown? silent failure? crash?)
- [ ] Language dropdown + starter template stay consistent when switching problems
      How to test: open Problem A, select Java, switch to Problem B via problem list, check both the dropdown AND the editor content match
- [ ] Empty `source_code` submission → clean 400, not a crash
- [ ] 100,000+ character `source_code` → rejected with 400, doesn't hang the server
- [ ] Invalid MongoDB ObjectId in a route param (e.g. `/problems/not-a-real-id`) → 400, not a 500
- [ ] Rapid double-click on Run or Submit → confirm no duplicate in-flight requests (buttons actually disable)
- [ ] Register/login with whitespace-only fields → rejected with 400 (new validation added Day 2 — confirm it doesn't also reject valid input by mistake)
- [ ] React Error Boundary: force a render error (e.g. temporarily throw in a component) → fallback UI shows, navbar still works, not a blank screen

## Day 1 items — Docker / multi-language

- [ ] All 5 languages (C, C++, Java, Python, JavaScript) run correctly via `/run` when hitting the DOCKERIZED backend (not `npm start` locally)
- [ ] All 5 languages work via `/submissions` (Submit), not just `/run` — confirm submissionController actually uses the language registry, not hardcoded C++
- [ ] Format Code button works for all 5 languages, or fails gracefully with a clear error for languages not yet supported by the formatter registry
- [ ] docker-compose.yml: `docker compose up --build` succeeds from a clean clone (no local node_modules, no cached layers) — this is the real test of "runs on any device"

## Day 3 — AI integration (to test once built)

- [ ] AI hint button appears on the problem page
- [ ] Clicking it sends problem statement + current code to the AI endpoint
- [ ] Response includes time complexity, space complexity, and an optimization nudge (not a full solution)
- [ ] Loading state shows while waiting for the AI response
- [ ] Error handling: what happens if the Gemini API key is invalid, rate-limited, or the API is down? Should show an error, not crash the page
- [ ] Confirm the AI is NOT leaking hidden test case data in its response (it shouldn't have access to hidden test cases at all — check what's actually sent in the request payload)
- [ ] Confirm the feature doesn't accidentally let a user get the AI to just write the full solution for them (prompt should resist "just give me the code" style follow-ups, though this is soft protection at best)

## Day 4 — AWS deployment (to test once deployed)

- [ ] Full user journey works on the DEPLOYED URL, not localhost: register → login → browse → solve (all 5 languages) → submit → view submission history → AI hint
- [ ] CORS works correctly between deployed frontend and backend domains (this WILL break initially — different origin than localhost)
- [ ] Environment variables (JWT secret, Mongo URI, Gemini API key) are set correctly on the deployed instance, not left as local dev defaults
- [ ] MongoDB Atlas connection works from the deployed backend (IP allowlist may need updating for the EC2 instance's IP)
- [ ] HTTPS/SSL — is the deployed site on http or https? If http only, note this as a known limitation for the mentor notes
- [ ] Docker containers restart correctly if the EC2 instance reboots (docker-compose restart policy)

## General edge cases to keep probing all week

- [ ] What happens if two users submit at the exact same time? (concurrency — probably fine given Node's single-threaded model + separate child processes, but worth a quick manual double-submit test)
- [ ] What happens if a submission's compiled code produces a huge amount of stdout (e.g. an infinite print loop that doesn't infinite-loop CPU-wise)? Could this exhaust memory/disk before the timeout catches it?
- [ ] What happens to orphaned temp files if the server crashes mid-execution (before the try/finally cleanup runs)? Not urgent to fix, but worth knowing the failure mode.
- [ ] Admin panel: can a `problem_setter` (non-admin) edit/delete a problem they don't own? Should be blocked — confirm.
- [ ] What does the mentor see if they visit the deployed URL immediately after your EC2 instance restarts and the containers haven't fully started yet (cold start)?

## Known, deliberately deferred (document, don't panic-fix this week)

- Per-submission sandboxing/isolation (code currently runs via child_process on the shared backend container, not an isolated container per submission)
- Rate limiting on any endpoint
- Contests
- Plagiarism detection
- Caching layer
- Multi-instance scaling / distributed queue

---

## Bug log (add entries as found during testing)

| Date | Bug found | Where | Status |
|---|---|---|---|
| | | | |