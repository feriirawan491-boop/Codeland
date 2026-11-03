export class FlightError extends Error {
  constructor(
    public code: string,
    message: string,
    public retryAfter?: number,
  ) {
    super(message);
    this.name = 'FlightError';
  }
}
