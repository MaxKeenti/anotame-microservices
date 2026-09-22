export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public body?: unknown,
    public errorCode?: string,
    /** Correlation ID from the `/api` proxy; matches the server and backend log lines. */
    public requestId?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}
