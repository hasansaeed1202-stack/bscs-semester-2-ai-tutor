export const CONTRACT_VERSION = '1'
export const LIMITS = Object.freeze({
  maxBodyBytes: 16_000,
  maxMessages: 12,
  maxMessageCharacters: 4_000,
  maxTotalCharacters: 12_000,
  maxOutputTokens: 800,
  providerTimeoutMs: 60_000,
})

export const ERROR_STATUS = Object.freeze({
  invalid_request: 400,
  origin_not_allowed: 403,
  method_not_allowed: 405,
  request_too_large: 413,
  rate_limited: 429,
  provider_rejected: 422,
  internal_error: 500,
  provider_unavailable: 502,
  invalid_provider_response: 502,
  curriculum_unavailable: 503,
  tutor_unavailable: 503,
  provider_timeout: 504,
})
