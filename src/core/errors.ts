/**
 * A rule invariant was violated: the state or a command is not what the core guarantees (a unit without a
 * position attacks, an unvalidated command is applied). This is a bug, not player input: invalid input
 * comes back as an error code from `validate`. The app catches it, offers a bug report and reloads the last
 * auto-save (concept/24-architecture §6.1).
 */
export class CoreInvariantError extends Error {
  readonly code: string;
  readonly details?: Record<string, unknown>;

  constructor(code: string, details?: Record<string, unknown>) {
    super(details ? `${code} ${JSON.stringify(details)}` : code);
    this.name = 'CoreInvariantError';
    this.code = code;
    this.details = details;
  }
}
