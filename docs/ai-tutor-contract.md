# AI Tutor API, privacy, and cost contract

The GitHub Pages client calls a separately deployed Cloudflare Worker. The client never receives a provider key and cannot choose the model, system prompt, tools, curriculum, or output limit.

## HTTP contract (version 1)

`POST /v1/chat` accepts JSON only from an exact `ALLOWED_ORIGINS` entry. Allowed fields are `subjectSlug`, optional `activeTopicId`, `messages`, and UUID `requestId`. Messages allow only `user`/`assistant`: at most 12 messages, 4,000 characters each, 12,000 total characters, and 16,000 request bytes. The last message is from the user.

Success returns `{requestId, answer, subjectSlug, curriculumVersion, usage}`. Errors return `{requestId, error: {code, message}}`. Stable codes: `invalid_request`, `origin_not_allowed`, `method_not_allowed`, `request_too_large`, `rate_limited`, `provider_rejected`, `provider_unavailable`, `invalid_provider_response`, `curriculum_unavailable`, `tutor_unavailable`, `provider_timeout`, and `internal_error`. Public responses contain no upstream diagnostics.

## Privacy and retention

There is no authentication or server transcript. The UI keeps separate subject history in tab memory. The limiter receives only an HMAC of the Cloudflare client IP using rotating `CLIENT_KEY_SECRET`; raw IPs and content are never stored or logged. Logs may contain request ID, subject slug, coarse status/provider class, latency, estimated usage, and limiter decision. Provider and Cloudflare retention must be reviewed before release.

## Cost and failure controls

The Durable Object atomically reserves per-client minute/hour/day counts and global daily request/output-token budgets before provider use. Defaults are 5/minute, 30/hour, 100/day, 5,000 global requests/day, and 2,000,000 reserved output tokens/day. Production owners set these deliberately. `TUTOR_ENABLED` is a fail-closed kill switch. Missing limiter, secret, curriculum, or config fails closed. Model and 800-token output ceiling are server-owned; calls time out after 20 seconds and are not retried.

Store `AI_API_KEY` and `CLIENT_KEY_SECRET` as Worker encrypted secrets. Configure exact origins, endpoint, model, budgets, provider hard caps, and billing alerts during release. Production deployment is intentionally outside this candidate.
