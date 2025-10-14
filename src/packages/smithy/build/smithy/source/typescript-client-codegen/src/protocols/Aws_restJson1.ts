// @ts-nocheck
// smithy-typescript generated code
import {
  GetAppTokenCommandInput,
  GetAppTokenCommandOutput,
} from "../commands/GetAppTokenCommand";
import {
  GetInstallationDataCommandInput,
  GetInstallationDataCommandOutput,
} from "../commands/GetInstallationDataCommand";
import {
  GetInstallationTokenCommandInput,
  GetInstallationTokenCommandOutput,
} from "../commands/GetInstallationTokenCommand";
import {
  GetInstallationsCommandInput,
  GetInstallationsCommandOutput,
} from "../commands/GetInstallationsCommand";
import {
  RefreshCachedDataCommandInput,
  RefreshCachedDataCommandOutput,
} from "../commands/RefreshCachedDataCommand";
import { AppFrameworkServiceException as __BaseException } from "../models/AppFrameworkServiceException";
import {
  ClientSideError,
  ScopeDown,
  ServerSideError,
  ValidationException,
} from "../models/models_0";
import {
  loadRestJsonErrorCode,
  parseJsonBody as parseBody,
  parseJsonErrorBody as parseErrorBody,
} from "@aws-sdk/core";
import { requestBuilder as rb } from "@smithy/core";
import {
  HttpRequest as __HttpRequest,
  HttpResponse as __HttpResponse,
} from "@smithy/protocol-http";
import {
  decorateServiceException as __decorateServiceException,
  expectInt32 as __expectInt32,
  expectNonNull as __expectNonNull,
  expectObject as __expectObject,
  expectString as __expectString,
  parseRfc3339DateTimeWithOffset as __parseRfc3339DateTimeWithOffset,
  _json,
  collectBody,
  map,
  take,
  withBaseException,
} from "@smithy/smithy-client";
import {
  Endpoint as __Endpoint,
  ResponseMetadata as __ResponseMetadata,
  SerdeContext as __SerdeContext,
} from "@smithy/types";

/**
 * serializeAws_restJson1GetAppTokenCommand
 */
export const se_GetAppTokenCommand = async(
  input: GetAppTokenCommandInput,
  context: __SerdeContext
): Promise<__HttpRequest> => {
  const b = rb(input, context);
  const headers: any = {
    'content-type': 'application/json',
  };
  b.bp("/tokens/app");
  let body: any;
  body = JSON.stringify(take(input, {
    'appId': [],
  }));
  b.m("POST")
  .h(headers)
  .b(body);
  return b.build();
}

/**
 * serializeAws_restJson1GetInstallationDataCommand
 */
export const se_GetInstallationDataCommand = async(
  input: GetInstallationDataCommandInput,
  context: __SerdeContext
): Promise<__HttpRequest> => {
  const b = rb(input, context);
  const headers: any = {
    'content-type': 'application/json',
  };
  b.bp("/installations/info");
  let body: any;
  body = JSON.stringify(take(input, {
    'nodeId': [],
  }));
  b.m("POST")
  .h(headers)
  .b(body);
  return b.build();
}

/**
 * serializeAws_restJson1GetInstallationsCommand
 */
export const se_GetInstallationsCommand = async(
  input: GetInstallationsCommandInput,
  context: __SerdeContext
): Promise<__HttpRequest> => {
  const b = rb(input, context);
  const headers: any = {
    'content-type': 'application/json',
  };
  b.bp("/installations");
  let body: any;
  body = JSON.stringify(take(input, {
    'maxResults': [],
    'nextToken': [],
  }));
  b.m("POST")
  .h(headers)
  .b(body);
  return b.build();
}

/**
 * serializeAws_restJson1GetInstallationTokenCommand
 */
export const se_GetInstallationTokenCommand = async(
  input: GetInstallationTokenCommandInput,
  context: __SerdeContext
): Promise<__HttpRequest> => {
  const b = rb(input, context);
  const headers: any = {
    'content-type': 'application/json',
  };
  b.bp("/tokens/installation");
  let body: any;
  body = JSON.stringify(take(input, {
    'appId': [],
    'nodeId': [],
    'scopeDown': _ => _json(_),
  }));
  b.m("POST")
  .h(headers)
  .b(body);
  return b.build();
}

/**
 * serializeAws_restJson1RefreshCachedDataCommand
 */
export const se_RefreshCachedDataCommand = async(
  input: RefreshCachedDataCommandInput,
  context: __SerdeContext
): Promise<__HttpRequest> => {
  const b = rb(input, context);
  const headers: any = {
  };
  b.bp("/installations/refresh");
  let body: any;
  b.m("POST")
  .h(headers)
  .b(body);
  return b.build();
}

/**
 * deserializeAws_restJson1GetAppTokenCommand
 */
export const de_GetAppTokenCommand = async(
  output: __HttpResponse,
  context: __SerdeContext
): Promise<GetAppTokenCommandOutput> => {
  if (output.statusCode !== 200 && output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const contents: any = map({
    $metadata: deserializeMetadata(output),
  });
  const data: Record<string, any> = __expectNonNull((__expectObject(await parseBody(output.body, context))), "body");
  const doc = take(data, {
    'appId': __expectInt32,
    'appToken': __expectString,
    'expirationTime': _ => __expectNonNull(__parseRfc3339DateTimeWithOffset(_)),
  });
  Object.assign(contents, doc);
  return contents;
}

/**
 * deserializeAws_restJson1GetInstallationDataCommand
 */
export const de_GetInstallationDataCommand = async(
  output: __HttpResponse,
  context: __SerdeContext
): Promise<GetInstallationDataCommandOutput> => {
  if (output.statusCode !== 200 && output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const contents: any = map({
    $metadata: deserializeMetadata(output),
  });
  const data: Record<string, any> = __expectNonNull((__expectObject(await parseBody(output.body, context))), "body");
  const doc = take(data, {
    'installations': _json,
  });
  Object.assign(contents, doc);
  return contents;
}

/**
 * deserializeAws_restJson1GetInstallationsCommand
 */
export const de_GetInstallationsCommand = async(
  output: __HttpResponse,
  context: __SerdeContext
): Promise<GetInstallationsCommandOutput> => {
  if (output.statusCode !== 200 && output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const contents: any = map({
    $metadata: deserializeMetadata(output),
  });
  const data: Record<string, any> = __expectNonNull((__expectObject(await parseBody(output.body, context))), "body");
  const doc = take(data, {
    'installations': _json,
    'nextToken': __expectString,
  });
  Object.assign(contents, doc);
  return contents;
}

/**
 * deserializeAws_restJson1GetInstallationTokenCommand
 */
export const de_GetInstallationTokenCommand = async(
  output: __HttpResponse,
  context: __SerdeContext
): Promise<GetInstallationTokenCommandOutput> => {
  if (output.statusCode !== 200 && output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const contents: any = map({
    $metadata: deserializeMetadata(output),
  });
  const data: Record<string, any> = __expectNonNull((__expectObject(await parseBody(output.body, context))), "body");
  const doc = take(data, {
    'actualScopeDown': _json,
    'appId': __expectInt32,
    'expirationTime': _ => __expectNonNull(__parseRfc3339DateTimeWithOffset(_)),
    'installationToken': __expectString,
    'nodeId': __expectString,
    'requestedScopeDown': _json,
  });
  Object.assign(contents, doc);
  return contents;
}

/**
 * deserializeAws_restJson1RefreshCachedDataCommand
 */
export const de_RefreshCachedDataCommand = async(
  output: __HttpResponse,
  context: __SerdeContext
): Promise<RefreshCachedDataCommandOutput> => {
  if (output.statusCode !== 200 && output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const contents: any = map({
    $metadata: deserializeMetadata(output),
  });
  const data: Record<string, any> = __expectNonNull((__expectObject(await parseBody(output.body, context))), "body");
  const doc = take(data, {
    'message': __expectString,
    'refreshedDate': _ => __expectNonNull(__parseRfc3339DateTimeWithOffset(_)),
  });
  Object.assign(contents, doc);
  return contents;
}

/**
 * deserialize_Aws_restJson1CommandError
 */
const de_CommandError = async(
  output: __HttpResponse,
  context: __SerdeContext,
): Promise<never> => {
  const parsedOutput: any = {
    ...output,
    body: await parseErrorBody(output.body, context)
  };
  const errorCode = loadRestJsonErrorCode(output, parsedOutput.body);
  switch (errorCode) {
    case "ClientSideError":
    case "framework.api#ClientSideError":
      throw await de_ClientSideErrorRes(parsedOutput, context);
    case "ServerSideError":
    case "framework.api#ServerSideError":
      throw await de_ServerSideErrorRes(parsedOutput, context);
    case "ValidationException":
    case "smithy.framework#ValidationException":
      throw await de_ValidationExceptionRes(parsedOutput, context);
    default:
      const parsedBody = parsedOutput.body;
      return throwDefaultError({
        output,
        parsedBody,
        errorCode
      }) as never
    }
  }

  const throwDefaultError = withBaseException(__BaseException);
  /**
   * deserializeAws_restJson1ClientSideErrorRes
   */
  const de_ClientSideErrorRes = async (
    parsedOutput: any,
    context: __SerdeContext
  ): Promise<ClientSideError> => {
    const contents: any = map({
    });
    const data: any = parsedOutput.body;
    const doc = take(data, {
      'message': __expectString,
    });
    Object.assign(contents, doc);
    const exception = new ClientSideError({
      $metadata: deserializeMetadata(parsedOutput),
      ...contents
    });
    return __decorateServiceException(exception, parsedOutput.body);
  };

  /**
   * deserializeAws_restJson1ServerSideErrorRes
   */
  const de_ServerSideErrorRes = async (
    parsedOutput: any,
    context: __SerdeContext
  ): Promise<ServerSideError> => {
    const contents: any = map({
    });
    const data: any = parsedOutput.body;
    const doc = take(data, {
      'message': __expectString,
    });
    Object.assign(contents, doc);
    const exception = new ServerSideError({
      $metadata: deserializeMetadata(parsedOutput),
      ...contents
    });
    return __decorateServiceException(exception, parsedOutput.body);
  };

  /**
   * deserializeAws_restJson1ValidationExceptionRes
   */
  const de_ValidationExceptionRes = async (
    parsedOutput: any,
    context: __SerdeContext
  ): Promise<ValidationException> => {
    const contents: any = map({
    });
    const data: any = parsedOutput.body;
    const doc = take(data, {
      'fieldList': _json,
      'message': __expectString,
    });
    Object.assign(contents, doc);
    const exception = new ValidationException({
      $metadata: deserializeMetadata(parsedOutput),
      ...contents
    });
    return __decorateServiceException(exception, parsedOutput.body);
  };

  // se_Permissions omitted.

  // se_RepositoryIds omitted.

  // se_RepositoryNames omitted.

  // se_ScopeDown omitted.

  // de_InstallationDataList omitted.

  // de_InstallationRecord omitted.

  // de_InstallationRecordList omitted.

  // de_Permissions omitted.

  // de_RepositoryIds omitted.

  // de_RepositoryNames omitted.

  // de_ScopeDown omitted.

  // de_ValidationExceptionField omitted.

  // de_ValidationExceptionFieldList omitted.

  const deserializeMetadata = (output: __HttpResponse): __ResponseMetadata => ({
    httpStatusCode: output.statusCode,
    requestId: output.headers["x-amzn-requestid"] ?? output.headers["x-amzn-request-id"] ?? output.headers["x-amz-request-id"],
    extendedRequestId: output.headers["x-amz-id-2"],
    cfId: output.headers["x-amz-cf-id"],
  });

  // Encode Uint8Array data into string with utf-8.
  const collectBodyString = (streamBody: any, context: __SerdeContext): Promise<string> => collectBody(streamBody, context).then(body => context.utf8Encoder(body))
