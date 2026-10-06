# AI Tutor API, privacy, and cost contract

The GitHub Pages client calls a separately deployed Cloudflare Worker. The client cannot choose the model, system prompt, tools, curriculum, or output limit.

## HTTP contract (version 1)

`POST /v1/chat` accepts JSON only from an exact `ALLOWED_ORIGINS` entry. Allowed fields are `subjectSlug`, optional `activeTopicId`, `messages`, UUID `requestId`, and an optional single `image`. Messages allow only `user`/`assistant`: at most 12 messages, 4,000 characters each, and 12,000 total characters. The last message is from the user. Requests are capped at 4.3 MB so a validated image can be carried as a data URL.

Images are limited to one JPEG, PNG, or WEBP of at most 3 MB. The Worker requires a matching MIME/data-URL pair, strict base64, and the corresponding JPEG/PNG/WEBP file signature; file extensions and browser metadata are not trusted. Raw image bytes are passed directly to Workers AI for that request and are never written to KV, Durable Objects, R2, logs, or transcript state.

Success returns `{requestId, answer, subjectSlug, curriculumVersion, usage}`. Errors return `{requestId, error: {code, message}}`. Stable codes: `invalid_request`, `origin_not_allowed`, `method_not_allowed`, `request_too_large`, `rate_limited`, `provider_rejected`, `provider_unavailable`, `invalid_provider_response`, `curriculum_unavailable`, `tutor_unavailable`, `provider_timeout`, and `internal_error`. Public responses contain no upstream diagnostics.

## Privacy and retention

There is no authentication or server transcript. The UI keeps separate subject history in tab memory. The limiter receives only an HMAC of the Cloudflare client IP using rotating `CLIENT_KEY_SECRET`; raw IPs and content are never stored or logged. Logs may contain request ID, subject slug, coarse status/provider class, latency, estimated usage, and limiter decision. Provider and Cloudflare retention must be reviewed before release.

## Provider, cost, and failure controls

Normal questions continue to use the native `AI` binding with `@cf/meta/llama-3.1-8b-instruct-fp8`. Image questions use a separate, server-owned `VISION_MODEL`, recommended as `@cf/meta/llama-3.2-11b-vision-instruct`; both paths retain the same curriculum system prompt and SSE response contract. The vision model is Cloudflare-hosted and explicitly supports an `image` data URL alongside messages. It requires the Cloudflare account owner to accept Meta's license and acceptable-use policy once before enabling the variable. If `VISION_MODEL` is absent, image requests fail closed with `vision_unavailable` while text tutoring remains available.

The Durable Object atomically reserves per-client minute/hour/day counts and global daily request/output-token budgets before provider use. Defaults are 5/minute, 30/hour, 100/day, 5,000 global requests/day, and 2,000,000 reserved output tokens/day. Production owners set these deliberately. `TUTOR_ENABLED` is a fail-closed kill switch. Missing limiter, secret, curriculum, AI binding, or model config fails closed. Model and 800-token output ceiling are server-owned; calls time out after 20 seconds and are not retried.

Store only `CLIENT_KEY_SECRET` as a Worker encrypted secret. Configure exact origins, budgets, Workers AI allocation monitoring, and alerts during release. Image requests currently share the existing conservative request/token limiter; review observed vision cost before considering a separate lower image quota. Production deployment, Meta license acceptance, and setting `VISION_MODEL` are intentionally outside this candidate.
