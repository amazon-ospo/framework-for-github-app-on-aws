// @ts-nocheck
// smithy-typescript generated code
import {
  ServiceException as __BaseException,
  CompositeCollectionValidator as __CompositeCollectionValidator,
  CompositeStructureValidator as __CompositeStructureValidator,
  CompositeValidator as __CompositeValidator,
  LengthValidator as __LengthValidator,
  MultiConstraintValidator as __MultiConstraintValidator,
  NoOpValidator as __NoOpValidator,
  RangeValidator as __RangeValidator,
  RequiredValidator as __RequiredValidator,
  ValidationFailure as __ValidationFailure,
} from "@aws-smithy/server-common";
import { ExceptionOptionType as __ExceptionOptionType } from "@smithy/smithy-client";

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
              new __RangeValidator(1, undefined),
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
  appToken?: string | undefined;
  appId?: number | undefined;
  expirationTime?: Date | undefined;
}

export namespace GetAppTokenOutput {
  const memberValidators : {
    appToken?: __MultiConstraintValidator<string>,
    appId?: __MultiConstraintValidator<number>,
    expirationTime?: __MultiConstraintValidator<Date>,
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
          case "expirationTime": {
            memberValidators["expirationTime"] = new __NoOpValidator();
            break;
          }
        }
      }
      return memberValidators[member]!!;
    }
    return [
      ...getMemberValidator("appToken").validate(obj.appToken, `${path}/appToken`),
      ...getMemberValidator("appId").validate(obj.appId, `${path}/appId`),
      ...getMemberValidator("expirationTime").validate(obj.expirationTime, `${path}/expirationTime`),
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
  fieldList?: (ValidationExceptionField)[] | undefined;

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
export interface GetInstallationDataInput {
  nodeId: string | undefined;
}

export namespace GetInstallationDataInput {
  const memberValidators : {
    nodeId?: __MultiConstraintValidator<string>,
  } = {};
  /**
   * @internal
   */
  export const validate = (obj: GetInstallationDataInput, path: string = ""): __ValidationFailure[] => {
    function getMemberValidator<T extends keyof typeof memberValidators>(member: T): NonNullable<typeof memberValidators[T]> {
      if (memberValidators[member] === undefined) {
        switch (member) {
          case "nodeId": {
            memberValidators["nodeId"] = new __CompositeValidator<string>([
              new __RequiredValidator(),
              new __LengthValidator(1, 256),
            ]);
            break;
          }
        }
      }
      return memberValidators[member]!!;
    }
    return [
      ...getMemberValidator("nodeId").validate(obj.nodeId, `${path}/nodeId`),
    ];
  }
}

/**
 * @public
 */
export interface InstallationData {
  nodeId?: string | undefined;
  appId?: number | undefined;
  installationId?: number | undefined;
}

export namespace InstallationData {
  const memberValidators : {
    nodeId?: __MultiConstraintValidator<string>,
    appId?: __MultiConstraintValidator<number>,
    installationId?: __MultiConstraintValidator<number>,
  } = {};
  /**
   * @internal
   */
  export const validate = (obj: InstallationData, path: string = ""): __ValidationFailure[] => {
    function getMemberValidator<T extends keyof typeof memberValidators>(member: T): NonNullable<typeof memberValidators[T]> {
      if (memberValidators[member] === undefined) {
        switch (member) {
          case "nodeId": {
            memberValidators["nodeId"] = new __NoOpValidator();
            break;
          }
          case "appId": {
            memberValidators["appId"] = new __NoOpValidator();
            break;
          }
          case "installationId": {
            memberValidators["installationId"] = new __NoOpValidator();
            break;
          }
        }
      }
      return memberValidators[member]!!;
    }
    return [
      ...getMemberValidator("nodeId").validate(obj.nodeId, `${path}/nodeId`),
      ...getMemberValidator("appId").validate(obj.appId, `${path}/appId`),
      ...getMemberValidator("installationId").validate(obj.installationId, `${path}/installationId`),
    ];
  }
}

/**
 * @public
 */
export interface GetInstallationDataOutput {
  installations?: (InstallationData)[] | undefined;
}

export namespace GetInstallationDataOutput {
  const memberValidators : {
    installations?: __MultiConstraintValidator<Iterable<InstallationData>>,
  } = {};
  /**
   * @internal
   */
  export const validate = (obj: GetInstallationDataOutput, path: string = ""): __ValidationFailure[] => {
    function getMemberValidator<T extends keyof typeof memberValidators>(member: T): NonNullable<typeof memberValidators[T]> {
      if (memberValidators[member] === undefined) {
        switch (member) {
          case "installations": {
            memberValidators["installations"] = new __CompositeCollectionValidator<InstallationData>(
              new __NoOpValidator(),
              new __CompositeStructureValidator<InstallationData>(
                new __NoOpValidator(),
                InstallationData.validate
              )
            );
            break;
          }
        }
      }
      return memberValidators[member]!!;
    }
    return [
      ...getMemberValidator("installations").validate(obj.installations, `${path}/installations`),
    ];
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
              new __RangeValidator(1, undefined),
            ]);
            break;
          }
          case "nodeId": {
            memberValidators["nodeId"] = new __CompositeValidator<string>([
              new __RequiredValidator(),
              new __LengthValidator(1, 256),
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
  installationToken?: string | undefined;
  nodeId?: string | undefined;
  appId?: number | undefined;
  expirationTime?: Date | undefined;
}

export namespace GetInstallationTokenOutput {
  const memberValidators : {
    installationToken?: __MultiConstraintValidator<string>,
    nodeId?: __MultiConstraintValidator<string>,
    appId?: __MultiConstraintValidator<number>,
    expirationTime?: __MultiConstraintValidator<Date>,
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
          case "expirationTime": {
            memberValidators["expirationTime"] = new __NoOpValidator();
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
      ...getMemberValidator("expirationTime").validate(obj.expirationTime, `${path}/expirationTime`),
    ];
  }
}

/**
 * @public
 */
export interface RefreshCachedDataInput {
}

export namespace RefreshCachedDataInput {
  const memberValidators : {
  } = {};
  /**
   * @internal
   */
  export const validate = (obj: RefreshCachedDataInput, path: string = ""): __ValidationFailure[] => {
    function getMemberValidator<T extends keyof typeof memberValidators>(member: T): NonNullable<typeof memberValidators[T]> {
      if (memberValidators[member] === undefined) {
        switch (member) {
        }
      }
      return memberValidators[member]!!;
    }
    return [
    ];
  }
}

/**
 * @public
 */
export interface RefreshCachedDataOutput {
  message?: string | undefined;
  refreshedDate?: Date | undefined;
}

export namespace RefreshCachedDataOutput {
  const memberValidators : {
    message?: __MultiConstraintValidator<string>,
    refreshedDate?: __MultiConstraintValidator<Date>,
  } = {};
  /**
   * @internal
   */
  export const validate = (obj: RefreshCachedDataOutput, path: string = ""): __ValidationFailure[] => {
    function getMemberValidator<T extends keyof typeof memberValidators>(member: T): NonNullable<typeof memberValidators[T]> {
      if (memberValidators[member] === undefined) {
        switch (member) {
          case "message": {
            memberValidators["message"] = new __NoOpValidator();
            break;
          }
          case "refreshedDate": {
            memberValidators["refreshedDate"] = new __NoOpValidator();
            break;
          }
        }
      }
      return memberValidators[member]!!;
    }
    return [
      ...getMemberValidator("message").validate(obj.message, `${path}/message`),
      ...getMemberValidator("refreshedDate").validate(obj.refreshedDate, `${path}/refreshedDate`),
    ];
  }
}
