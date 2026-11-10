/**
 * Auth0 refused the account (OAuth error=access_denied), e.g. a tenant Action
 * that blocks unverified emails. Thrown by authService so the UI can explain
 * it instead of a generic "Sign-in failed".
 *
 * Measured 2026-11-10 on the DEV tenant: a new account was denied with
 * error_description "Unauthorized" before its first successful login, while
 * an UNVERIFIED email (email_verified=false) later logged in fine — so that
 * denial is not the verify-email rule and Auth0 does not say why. Only a
 * description that names verification gets the explicit verify-email copy;
 * everything else gets neutral copy. Consent "Decline" is a silent cancel.
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
