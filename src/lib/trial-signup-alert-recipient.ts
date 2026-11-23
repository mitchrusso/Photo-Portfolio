export const DEFAULT_TRIAL_SIGNUP_ALERT_EMAIL = "support@photoview.io"

export function resolveTrialSignupAlertEmail(configuredEmail?: string) {
  return configuredEmail?.trim() || DEFAULT_TRIAL_SIGNUP_ALERT_EMAIL
}
