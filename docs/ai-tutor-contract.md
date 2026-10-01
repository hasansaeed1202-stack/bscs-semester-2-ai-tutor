# AI Tutor API, privacy, and cost contract

The GitHub Pages client calls a separately deployed Cloudflare Worker. The client cannot choose the model, system prompt, tools, curriculum, or output limit.

## HTTP contract (version 1)

`POST /v1/chat` accepts JSON only from an exact `ALLOWED_ORIGINS` entry. Allowed fields are `subjectSlug`, optional `activeTopicId`, `messages`, and UUID `requestId`. Messages allow only `user`/`assistant`: at most 12 messages, 4,000 characters each, 12,000 total characters, and 16,000 request bytes. The last message is from the user.

Success returns `{requestId, answer, subjectSlug, curriculumVersion, usage}`. Errors return `{requestId, error: {code, message}}`. Stable codes: `invalid_request`, `origin_not_allowed`, `method_not_allowed`, `request_too_large`, `rate_limited`, `provider_rejected`, `provider_unavailable`, `invalid_provider_response`, `curriculum_unavailable`, `tutor_unavailable`, `provider_timeout`, and `internal_error`. Public responses contain no upstream diagnostics.

## Privacy and retention

There is no authentication or server transcript. The UI keeps separate subject history in tab memory. The limiter receives only an HMAC of the Cloudflare client IP using rotating `CLIENT_KEY_SECRET`; raw IPs and content are never stored or logged. Logs may contain request ID, subject slug, coarse status/provider class, latency, estimated usage, and limiter decision. Provider and Cloudflare retention must be reviewed before release.

## Provider, cost, and failure controls

The Worker uses the native `AI` binding with `@cf/meta/llama-3.1-8b-instruct-fp8`. This instruction-tuned, Cloudflare-hosted text model has a 32,000-token context window and is eligible for Workers AI's daily free allocation. The binding requires no provider API key; `AI_MODEL` remains a non-secret, server-owned variable.

The Durable Object atomically reserves per-client minute/hour/day counts and global daily request/output-token budgets before provider use. Defaults are 5/minute, 30/hour, 100/day, 5,000 global requests/day, and 2,000,000 reserved output tokens/day. Production owners set these deliberately. `TUTOR_ENABLED` is a fail-closed kill switch. Missing limiter, secret, curriculum, AI binding, or model config fails closed. Model and 800-token output ceiling are server-owned; calls time out after 20 seconds and are not retried.

Store only `CLIENT_KEY_SECRET` as a Worker encrypted secret. Configure exact origins, budgets, Workers AI allocation monitoring, and alerts during release. Workers AI currently includes 10,000 neurons per day at no charge and rejects further operations after the free allocation is exhausted on the Workers Free plan; the application's stricter reservation budgets remain a separate guard. Production deployment is intentionally outside this candidate.
