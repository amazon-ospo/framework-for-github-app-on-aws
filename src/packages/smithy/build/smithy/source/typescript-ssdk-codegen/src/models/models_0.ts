// @ts-nocheck
// smithy-typescript generated code
import {
  ServiceException as __BaseException,
  CompositeValidator as __CompositeValidator,
  MultiConstraintValidator as __MultiConstraintValidator,
  NoOpValidator as __NoOpValidator,
  RequiredValidator as __RequiredValidator,
  ValidationFailure as __ValidationFailure,
} from "@aws-smithy/server-common";
import { ExceptionOptionType as __ExceptionOptionType } from "@smithy/smithy-client";

/**
 * @public
 */
export class AccessDeniedError extends __BaseException {
  readonly name: "AccessDeniedError" = "AccessDeniedError";
  readonly $fault: "client" = "client";
  constructor(opts: __ExceptionOptionType<AccessDeniedError, __BaseException>) {
    super({
      name: "AccessDeniedError",
      $fault: "client",
      ...opts
    });
    Object.setPrototypeOf(this, AccessDeniedError.prototype);
  }
}

/**
 * @public
 */
export class ClientSideError extends __BaseException {
  readonly name: "ClientSideError" = "ClientSideError";
  readonly $fault: "client" = "client";
  constructor(opts: __ExceptionOptionType<ClientSideError, __BaseException>) {
    super({
      name: "ClientSideError",
      $fault: "client",
      ...opts
    });
    Object.setPrototypeOf(this, ClientSideError.prototype);
  }
}

/**
 * @public
 */
export class GatewayTimeoutError extends __BaseException {
  readonly name: "GatewayTimeoutError" = "GatewayTimeoutError";
  readonly $fault: "server" = "server";
  constructor(opts: __ExceptionOptionType<GatewayTimeoutError, __BaseException>) {
    super({
      name: "GatewayTimeoutError",
      $fault: "server",
      ...opts
    });
    Object.setPrototypeOf(this, GatewayTimeoutError.prototype);
  }
}

/**
 * @public
 */
export interface GetAppTokenInput {
  appId: number | undefined;
}

export namespace GetAppTokenInput {
  const memberValidators : {
    appId?: __MultiConstraintValidator<number>,
  } = {};
  /**
   * @internal
   */
  export const validate = (obj: GetAppTokenInput, path: string = ""): __ValidationFailure[] => {
    function getMemberValidator<T extends keyof typeof memberValidators>(member: T): NonNullable<typeof memberValidators[T]> {
      if (memberValidators[member] === undefined) {
        switch (member) {
          case "appId": {
            memberValidators["appId"] = new __CompositeValidator<number>([
              new __RequiredValidator(),
            ]);
            break;
          }
        }
      }
      return memberValidators[member]!!;
    }
    return [
      ...getMemberValidator("appId").validate(obj.appId, `${path}/appId`),
    ];
  }
}

/**
 * @public
 */
export interface GetAppTokenOutput {
  appToken?: string;
  appId?: number;
}

export namespace GetAppTokenOutput {
  const memberValidators : {
    appToken?: __MultiConstraintValidator<string>,
    appId?: __MultiConstraintValidator<number>,
  } = {};
  /**
   * @internal
   */
  export const validate = (obj: GetAppTokenOutput, path: string = ""): __ValidationFailure[] => {
    function getMemberValidator<T extends keyof typeof memberValidators>(member: T): NonNullable<typeof memberValidators[T]> {
      if (memberValidators[member] === undefined) {
        switch (member) {
          case "appToken": {
            memberValidators["appToken"] = new __NoOpValidator();
            break;
          }
          case "appId": {
            memberValidators["appId"] = new __NoOpValidator();
            break;
          }
        }
      }
      return memberValidators[member]!!;
    }
    return [
      ...getMemberValidator("appToken").validate(obj.appToken, `${path}/appToken`),
      ...getMemberValidator("appId").validate(obj.appId, `${path}/appId`),
    ];
  }
}

/**
 * @public
 */
export class ServerSideError extends __BaseException {
  readonly name: "ServerSideError" = "ServerSideError";
  readonly $fault: "server" = "server";
  constructor(opts: __ExceptionOptionType<ServerSideError, __BaseException>) {
    super({
      name: "ServerSideError",
      $fault: "server",
      ...opts
    });
    Object.setPrototypeOf(this, ServerSideError.prototype);
  }
}

/**
 * @public
 */
export class ServiceUnavailableError extends __BaseException {
  readonly name: "ServiceUnavailableError" = "ServiceUnavailableError";
  readonly $fault: "server" = "server";
  constructor(opts: __ExceptionOptionType<ServiceUnavailableError, __BaseException>) {
    super({
      name: "ServiceUnavailableError",
      $fault: "server",
      ...opts
    });
    Object.setPrototypeOf(this, ServiceUnavailableError.prototype);
  }
}

/**
 * Describes one specific validation failure for an input member.
 * @public
 */
export interface ValidationExceptionField {
  /**
   * A JSONPointer expression to the structure member whose value failed to satisfy the modeled constraints.
   * @public
   */
  path: string | undefined;

  /**
   * A detailed description of the validation failure.
   * @public
   */
  message: string | undefined;
}

export namespace ValidationExceptionField {
  const memberValidators : {
    path?: __MultiConstraintValidator<string>,
    message?: __MultiConstraintValidator<string>,
  } = {};
  /**
   * @internal
   */
  export const validate = (obj: ValidationExceptionField, path: string = ""): __ValidationFailure[] => {
    function getMemberValidator<T extends keyof typeof memberValidators>(member: T): NonNullable<typeof memberValidators[T]> {
      if (memberValidators[member] === undefined) {
        switch (member) {
          case "path": {
            memberValidators["path"] = new __CompositeValidator<string>([
              new __RequiredValidator(),
            ]);
            break;
          }
          case "message": {
            memberValidators["message"] = new __CompositeValidator<string>([
              new __RequiredValidator(),
            ]);
            break;
          }
        }
      }
      return memberValidators[member]!!;
    }
    return [
      ...getMemberValidator("path").validate(obj.path, `${path}/path`),
      ...getMemberValidator("message").validate(obj.message, `${path}/message`),
    ];
  }
}

/**
 * A standard error for input validation failures.
 * This should be thrown by services when a member of the input structure
 * falls outside of the modeled or documented constraints.
 * @public
 */
export class ValidationException extends __BaseException {
  readonly name: "ValidationException" = "ValidationException";
  readonly $fault: "client" = "client";
  /**
   * A list of specific failures encountered while validating the input.
   * A member can appear in this list more than once if it failed to satisfy multiple constraints.
   * @public
   */
  fieldList?: (ValidationExceptionField)[];

  constructor(opts: __ExceptionOptionType<ValidationException, __BaseException>) {
    super({
      name: "ValidationException",
      $fault: "client",
      ...opts
    });
    Object.setPrototypeOf(this, ValidationException.prototype);
    this.fieldList = opts.fieldList;
  }
}

/**
 * @public
 */
export interface GetInstallationTokenInput {
  appId: number | undefined;
  nodeId: string | undefined;
}

export namespace GetInstallationTokenInput {
  const memberValidators : {
    appId?: __MultiConstraintValidator<number>,
    nodeId?: __MultiConstraintValidator<string>,
  } = {};
  /**
   * @internal
   */
  export const validate = (obj: GetInstallationTokenInput, path: string = ""): __ValidationFailure[] => {
    function getMemberValidator<T extends keyof typeof memberValidators>(member: T): NonNullable<typeof memberValidators[T]> {
      if (memberValidators[member] === undefined) {
        switch (member) {
          case "appId": {
            memberValidators["appId"] = new __CompositeValidator<number>([
              new __RequiredValidator(),
            ]);
            break;
          }
          case "nodeId": {
            memberValidators["nodeId"] = new __CompositeValidator<string>([
              new __RequiredValidator(),
            ]);
            break;
          }
        }
      }
      return memberValidators[member]!!;
    }
    return [
      ...getMemberValidator("appId").validate(obj.appId, `${path}/appId`),
      ...getMemberValidator("nodeId").validate(obj.nodeId, `${path}/nodeId`),
    ];
  }
}

/**
 * @public
 */
export interface GetInstallationTokenOutput {
  installationToken?: string;
  nodeId?: string;
  appId?: number;
}

export namespace GetInstallationTokenOutput {
  const memberValidators : {
    installationToken?: __MultiConstraintValidator<string>,
    nodeId?: __MultiConstraintValidator<string>,
    appId?: __MultiConstraintValidator<number>,
  } = {};
  /**
   * @internal
   */
  export const validate = (obj: GetInstallationTokenOutput, path: string = ""): __ValidationFailure[] => {
    function getMemberValidator<T extends keyof typeof memberValidators>(member: T): NonNullable<typeof memberValidators[T]> {
      if (memberValidators[member] === undefined) {
        switch (member) {
          case "installationToken": {
            memberValidators["installationToken"] = new __NoOpValidator();
            break;
          }
          case "nodeId": {
            memberValidators["nodeId"] = new __NoOpValidator();
            break;
          }
          case "appId": {
            memberValidators["appId"] = new __NoOpValidator();
            break;
          }
        }
      }
      return memberValidators[member]!!;
    }
    return [
      ...getMemberValidator("installationToken").validate(obj.installationToken, `${path}/installationToken`),
      ...getMemberValidator("nodeId").validate(obj.nodeId, `${path}/nodeId`),
      ...getMemberValidator("appId").validate(obj.appId, `${path}/appId`),
    ];
  }
}

/**
 * @public
 */
export class RateLimitError extends __BaseException {
  readonly name: "RateLimitError" = "RateLimitError";
  readonly $fault: "client" = "client";
  constructor(opts: __ExceptionOptionType<RateLimitError, __BaseException>) {
    super({
      name: "RateLimitError",
      $fault: "client",
      ...opts
    });
    Object.setPrototypeOf(this, RateLimitError.prototype);
  }
}
