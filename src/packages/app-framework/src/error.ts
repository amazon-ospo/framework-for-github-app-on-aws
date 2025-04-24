// Base class for errors that can be shown to end users
export class VisibleError extends Error {}
// Error thrown when a requested resource cannot be found
export class NotFound extends VisibleError {}

/**
 * Base class for server-side errors.
 * Thrown when the server encounters an unexpected internal error that cannot be attributed to client input.
 */
export class ServerError extends Error {}
// Error thrown when server fails to process or validate data.
// Extends ServerError as these are internal processing failures rather than client-side issues
export class DataError extends ServerError {}

// Error is thrown when GitHub is running into errors processing requests
export class GitHubError extends ServerError {}

// Error is thrown when environment for lambda functions are not configured properly
export class EnvironmentError extends ServerError {}

/**
 * TODO: After we change the smithy model to perform empty string validation, delete these.
 */
export class ClientError extends Error {}

// Error is thrown when request parameters provided to APIs are of incorrect format
export class RequestError extends ClientError {}
