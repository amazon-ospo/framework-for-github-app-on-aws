export class NotFound extends Error {
  constructor(message: string) {
    super(message);
  }
}
export class DataError extends Error {}

export class ServerError extends Error {}
export class GitHubError extends ServerError {}
export class EnvironmentError extends ServerError {}
export class ClientError extends Error {}
export class RequestError extends ClientError {}
