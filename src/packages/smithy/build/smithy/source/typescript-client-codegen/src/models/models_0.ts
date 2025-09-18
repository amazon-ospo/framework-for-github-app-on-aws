// @ts-nocheck
// smithy-typescript generated code
import { AppFrameworkServiceException as __BaseException } from "./AppFrameworkServiceException";
import { ExceptionOptionType as __ExceptionOptionType } from "@smithy/smithy-client";

/**
 * @public
 */
export class ClientSideError extends __BaseException {
  readonly name: "ClientSideError" = "ClientSideError";
  readonly $fault: "client" = "client";
  /**
   * @internal
   */
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

/**
 * @public
 */
export interface GetAppTokenOutput {
  appToken?: string | undefined;
  appId?: number | undefined;
  expirationTime?: Date | undefined;
}

/**
 * @public
 */
export class ServerSideError extends __BaseException {
  readonly name: "ServerSideError" = "ServerSideError";
  readonly $fault: "server" = "server";
  /**
   * @internal
   */
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

  /**
   * @internal
   */
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

/**
 * @public
 */
export interface InstallationData {
  nodeId?: string | undefined;
  appId?: number | undefined;
  installationId?: number | undefined;
}

/**
 * @public
 */
export interface GetInstallationDataOutput {
  installations?: (InstallationData)[] | undefined;
}

/**
 * @public
 */
export interface GetInstallationsInput {
  maxResults?: number | undefined;
  nextToken?: string | undefined;
}

/**
 * @public
 */
export interface InstallationRecord {
  appId: number | undefined;
  installationId: number | undefined;
  nodeId: string | undefined;
  targetType: string | undefined;
}

/**
 * @public
 */
export interface GetInstallationsOutput {
  nextToken?: string | undefined;
  installations: (InstallationRecord)[] | undefined;
}

/**
 * @public
 */
export interface ScopeDown {
  repositoryIds?: (number)[] | undefined;
  repositoryNames?: (string)[] | undefined;
  permissions?: Record<string, string> | undefined;
}

/**
 * @public
 */
export interface GetInstallationTokenInput {
  appId: number | undefined;
  nodeId: string | undefined;
  scopeDown?: ScopeDown | undefined;
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

/**
 * @public
 */
export interface RefreshCachedDataInput {
}

/**
 * @public
 */
export interface RefreshCachedDataOutput {
  message?: string | undefined;
  refreshedDate?: Date | undefined;
}
