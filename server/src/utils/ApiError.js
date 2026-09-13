/**
 * Small typed error so controllers can `throw new ApiError(404, "...")`
 * and the centralized error handler knows exactly what HTTP status and
 * message to send back, instead of leaking stack traces to the client.
 */
export class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.name = "ApiError";
  }
}
