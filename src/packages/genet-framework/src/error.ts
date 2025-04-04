export class NotFound extends Error {
  constructor(message: string) {
    super(message);
  }
}
export class DataError extends Error {}
