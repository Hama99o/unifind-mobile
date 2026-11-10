/**
 * Auth0 refused the account (OAuth error=access_denied), e.g. a tenant Action
 * that blocks unverified emails. Thrown by authService so the UI can explain
 * it instead of a generic "Sign-in failed".
 *
 * Measured 2026-11-10 on the DEV tenant: an unverified sign-up returns
 * error_description "Unauthorized" — Auth0 does not say WHY, so only a
 * description that names verification gets the explicit verify-email copy.
 */
export class AuthDeniedError extends Error {
  readonly description: string;

  constructor(description: string) {
    super(`Auth0 error: ${description}`);
    this.name = "AuthDeniedError";
    this.description = description;
  }

  /** True only when Auth0 actually says the email is not verified. */
  get isUnverifiedEmail(): boolean {
    return /verif/i.test(this.description);
  }
}
