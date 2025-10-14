// @ts-nocheck
// smithy-typescript generated code
import {
  ServiceException as __BaseException,
  CompositeCollectionValidator as __CompositeCollectionValidator,
  CompositeMapValidator as __CompositeMapValidator,
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
export interface InstallationRecord {
  appId: number | undefined;
  installationId: number | undefined;
  nodeId: string | undefined;
  targetType: string | undefined;
  name: string | undefined;
}

export namespace InstallationRecord {
  const memberValidators : {
    appId?: __MultiConstraintValidator<number>,
    installationId?: __MultiConstraintValidator<number>,
    nodeId?: __MultiConstraintValidator<string>,
    targetType?: __MultiConstraintValidator<string>,
    name?: __MultiConstraintValidator<string>,
  } = {};
  /**
   * @internal
   */
  export const validate = (obj: InstallationRecord, path: string = ""): __ValidationFailure[] => {
    function getMemberValidator<T extends keyof typeof memberValidators>(member: T): NonNullable<typeof memberValidators[T]> {
      if (memberValidators[member] === undefined) {
        switch (member) {
          case "appId": {
            memberValidators["appId"] = new __CompositeValidator<number>([
              new __RequiredValidator(),
            ]);
            break;
          }
          case "installationId": {
            memberValidators["installationId"] = new __CompositeValidator<number>([
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
          case "targetType": {
            memberValidators["targetType"] = new __CompositeValidator<string>([
              new __RequiredValidator(),
            ]);
            break;
          }
          case "name": {
            memberValidators["name"] = new __CompositeValidator<string>([
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
      ...getMemberValidator("installationId").validate(obj.installationId, `${path}/installationId`),
      ...getMemberValidator("nodeId").validate(obj.nodeId, `${path}/nodeId`),
      ...getMemberValidator("targetType").validate(obj.targetType, `${path}/targetType`),
      ...getMemberValidator("name").validate(obj.name, `${path}/name`),
    ];
  }
}

/**
 * @public
 */
export interface GetInstallationDataOutput {
  installations?: (InstallationRecord)[] | undefined;
}

export namespace GetInstallationDataOutput {
  const memberValidators : {
    installations?: __MultiConstraintValidator<Iterable<InstallationRecord>>,
  } = {};
  /**
   * @internal
   */
  export const validate = (obj: GetInstallationDataOutput, path: string = ""): __ValidationFailure[] => {
    function getMemberValidator<T extends keyof typeof memberValidators>(member: T): NonNullable<typeof memberValidators[T]> {
      if (memberValidators[member] === undefined) {
        switch (member) {
          case "installations": {
            memberValidators["installations"] = new __CompositeCollectionValidator<InstallationRecord>(
              new __NoOpValidator(),
              new __CompositeStructureValidator<InstallationRecord>(
                new __NoOpValidator(),
                InstallationRecord.validate
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
export interface GetInstallationsInput {
  maxResults?: number | undefined;
  nextToken?: string | undefined;
}

export namespace GetInstallationsInput {
  const memberValidators : {
    maxResults?: __MultiConstraintValidator<number>,
    nextToken?: __MultiConstraintValidator<string>,
  } = {};
  /**
   * @internal
   */
  export const validate = (obj: GetInstallationsInput, path: string = ""): __ValidationFailure[] => {
    function getMemberValidator<T extends keyof typeof memberValidators>(member: T): NonNullable<typeof memberValidators[T]> {
      if (memberValidators[member] === undefined) {
        switch (member) {
          case "maxResults": {
            memberValidators["maxResults"] = new __NoOpValidator();
            break;
          }
          case "nextToken": {
            memberValidators["nextToken"] = new __NoOpValidator();
            break;
          }
        }
      }
      return memberValidators[member]!!;
    }
    return [
      ...getMemberValidator("maxResults").validate(obj.maxResults, `${path}/maxResults`),
      ...getMemberValidator("nextToken").validate(obj.nextToken, `${path}/nextToken`),
    ];
  }
}

/**
 * @public
 */
export interface GetInstallationsOutput {
  nextToken?: string | undefined;
  installations: (InstallationRecord)[] | undefined;
}

export namespace GetInstallationsOutput {
  const memberValidators : {
    nextToken?: __MultiConstraintValidator<string>,
    installations?: __MultiConstraintValidator<Iterable<InstallationRecord>>,
  } = {};
  /**
   * @internal
   */
  export const validate = (obj: GetInstallationsOutput, path: string = ""): __ValidationFailure[] => {
    function getMemberValidator<T extends keyof typeof memberValidators>(member: T): NonNullable<typeof memberValidators[T]> {
      if (memberValidators[member] === undefined) {
        switch (member) {
          case "nextToken": {
            memberValidators["nextToken"] = new __NoOpValidator();
            break;
          }
          case "installations": {
            memberValidators["installations"] = new __CompositeCollectionValidator<InstallationRecord>(
              new __CompositeValidator<(InstallationRecord)[]>([
                new __RequiredValidator(),
              ]),
              new __CompositeStructureValidator<InstallationRecord>(
                new __NoOpValidator(),
                InstallationRecord.validate
              )
            );
            break;
          }
        }
      }
      return memberValidators[member]!!;
    }
    return [
      ...getMemberValidator("nextToken").validate(obj.nextToken, `${path}/nextToken`),
      ...getMemberValidator("installations").validate(obj.installations, `${path}/installations`),
    ];
  }
}

/**
 * @public
 */
export interface ScopeDown {
  repositoryIds?: (number)[] | undefined;
  repositoryNames?: (string)[] | undefined;
  permissions?: Record<string, string> | undefined;
}

export namespace ScopeDown {
  const memberValidators : {
    repositoryIds?: __MultiConstraintValidator<Iterable<number>>,
    repositoryNames?: __MultiConstraintValidator<Iterable<string>>,
    permissions?: __MultiConstraintValidator<Record<string, string>>,
  } = {};
  /**
   * @internal
   */
  export const validate = (obj: ScopeDown, path: string = ""): __ValidationFailure[] => {
    function getMemberValidator<T extends keyof typeof memberValidators>(member: T): NonNullable<typeof memberValidators[T]> {
      if (memberValidators[member] === undefined) {
        switch (member) {
          case "repositoryIds": {
            memberValidators["repositoryIds"] = new __CompositeCollectionValidator<number>(
              new __NoOpValidator(),
              new __NoOpValidator()
            );
            break;
          }
          case "repositoryNames": {
            memberValidators["repositoryNames"] = new __CompositeCollectionValidator<string>(
              new __NoOpValidator(),
              new __NoOpValidator()
            );
            break;
          }
          case "permissions": {
            memberValidators["permissions"] = new __CompositeMapValidator<string>(
              new __NoOpValidator(),
              new __NoOpValidator(),
              new __NoOpValidator()
            );
            break;
          }
        }
      }
      return memberValidators[member]!!;
    }
    return [
      ...getMemberValidator("repositoryIds").validate(obj.repositoryIds, `${path}/repositoryIds`),
      ...getMemberValidator("repositoryNames").validate(obj.repositoryNames, `${path}/repositoryNames`),
      ...getMemberValidator("permissions").validate(obj.permissions, `${path}/permissions`),
    ];
  }
}

/**
 * @public
 */
export interface GetInstallationTokenInput {
  appId: number | undefined;
  nodeId: string | undefined;
  scopeDown?: ScopeDown | undefined;
}

export namespace GetInstallationTokenInput {
  const memberValidators : {
    appId?: __MultiConstraintValidator<number>,
    nodeId?: __MultiConstraintValidator<string>,
    scopeDown?: __MultiConstraintValidator<ScopeDown>,
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
          case "scopeDown": {
            memberValidators["scopeDown"] = new __CompositeStructureValidator<ScopeDown>(
              new __NoOpValidator(),
              ScopeDown.validate
            );
            break;
          }
        }
      }
      return memberValidators[member]!!;
    }
    return [
      ...getMemberValidator("appId").validate(obj.appId, `${path}/appId`),
      ...getMemberValidator("nodeId").validate(obj.nodeId, `${path}/nodeId`),
      ...getMemberValidator("scopeDown").validate(obj.scopeDown, `${path}/scopeDown`),
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
  requestedScopeDown?: ScopeDown | undefined;
  actualScopeDown?: ScopeDown | undefined;
}

export namespace GetInstallationTokenOutput {
  const memberValidators : {
    installationToken?: __MultiConstraintValidator<string>,
    nodeId?: __MultiConstraintValidator<string>,
    appId?: __MultiConstraintValidator<number>,
    expirationTime?: __MultiConstraintValidator<Date>,
    requestedScopeDown?: __MultiConstraintValidator<ScopeDown>,
    actualScopeDown?: __MultiConstraintValidator<ScopeDown>,
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
          case "requestedScopeDown": {
            memberValidators["requestedScopeDown"] = new __CompositeStructureValidator<ScopeDown>(
              new __NoOpValidator(),
              ScopeDown.validate
            );
            break;
          }
          case "actualScopeDown": {
            memberValidators["actualScopeDown"] = new __CompositeStructureValidator<ScopeDown>(
              new __NoOpValidator(),
              ScopeDown.validate
            );
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
      ...getMemberValidator("requestedScopeDown").validate(obj.requestedScopeDown, `${path}/requestedScopeDown`),
      ...getMemberValidator("actualScopeDown").validate(obj.actualScopeDown, `${path}/actualScopeDown`),
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
