// Error is thrown when necessary data is not present for GitHub API output or DynamoDB calls
export class NotFound extends Error {
  constructor(message: string) {
    super(message);
  }
}

// Error is thrown when the data is not present in the right format for GitHub API output or DynamoDB calls
export class DataError extends Error {}
export class ServerError extends Error {}

// Error is thrown when GitHub is running into errors processing requests
export class GitHubError extends Error {}

// Error is thrown when environment for lambda functions are not configured properly
export class EnvironmentError extends Error {}
export class ClientError extends Error {}

// Error is thrown when request parameters provided to APIs are of incorrect format
export class RequestError extends ClientError {}
