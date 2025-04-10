// @ts-nocheck
// smithy-typescript generated code
import {
  GetAppTokenCommandInput,
  GetAppTokenCommandOutput,
} from "../commands/GetAppTokenCommand";
import {
  GetInstallationTokenCommandInput,
  GetInstallationTokenCommandOutput,
} from "../commands/GetInstallationTokenCommand";
import { AppFrameworkServiceException as __BaseException } from "../models/AppFrameworkServiceException";
import {
  AccessDeniedError,
  ClientSideError,
  GatewayTimeoutError,
  RateLimitError,
  ServerSideError,
  ServiceUnavailableError,
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
  }));
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
    'appId': __expectInt32,
    'installationToken': __expectString,
    'nodeId': __expectString,
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
    case "AccessDeniedError":
    case "framework.api#AccessDeniedError":
      throw await de_AccessDeniedErrorRes(parsedOutput, context);
    case "ClientSideError":
    case "framework.api#ClientSideError":
      throw await de_ClientSideErrorRes(parsedOutput, context);
    case "GatewayTimeoutError":
    case "framework.api#GatewayTimeoutError":
      throw await de_GatewayTimeoutErrorRes(parsedOutput, context);
    case "ServerSideError":
    case "framework.api#ServerSideError":
      throw await de_ServerSideErrorRes(parsedOutput, context);
    case "ServiceUnavailableError":
    case "framework.api#ServiceUnavailableError":
      throw await de_ServiceUnavailableErrorRes(parsedOutput, context);
    case "ValidationException":
    case "smithy.framework#ValidationException":
      throw await de_ValidationExceptionRes(parsedOutput, context);
    case "RateLimitError":
    case "framework.api#RateLimitError":
      throw await de_RateLimitErrorRes(parsedOutput, context);
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
   * deserializeAws_restJson1AccessDeniedErrorRes
   */
  const de_AccessDeniedErrorRes = async (
    parsedOutput: any,
    context: __SerdeContext
  ): Promise<AccessDeniedError> => {
    const contents: any = map({
    });
    const data: any = parsedOutput.body;
    const doc = take(data, {
      'message': __expectString,
    });
    Object.assign(contents, doc);
    const exception = new AccessDeniedError({
      $metadata: deserializeMetadata(parsedOutput),
      ...contents
    });
    return __decorateServiceException(exception, parsedOutput.body);
  };

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
   * deserializeAws_restJson1GatewayTimeoutErrorRes
   */
  const de_GatewayTimeoutErrorRes = async (
    parsedOutput: any,
    context: __SerdeContext
  ): Promise<GatewayTimeoutError> => {
    const contents: any = map({
    });
    const data: any = parsedOutput.body;
    const doc = take(data, {
      'message': __expectString,
    });
    Object.assign(contents, doc);
    const exception = new GatewayTimeoutError({
      $metadata: deserializeMetadata(parsedOutput),
      ...contents
    });
    return __decorateServiceException(exception, parsedOutput.body);
  };

  /**
   * deserializeAws_restJson1RateLimitErrorRes
   */
  const de_RateLimitErrorRes = async (
    parsedOutput: any,
    context: __SerdeContext
  ): Promise<RateLimitError> => {
    const contents: any = map({
    });
    const data: any = parsedOutput.body;
    const doc = take(data, {
      'message': __expectString,
    });
    Object.assign(contents, doc);
    const exception = new RateLimitError({
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
   * deserializeAws_restJson1ServiceUnavailableErrorRes
   */
  const de_ServiceUnavailableErrorRes = async (
    parsedOutput: any,
    context: __SerdeContext
  ): Promise<ServiceUnavailableError> => {
    const contents: any = map({
    });
    const data: any = parsedOutput.body;
    const doc = take(data, {
      'message': __expectString,
    });
    Object.assign(contents, doc);
    const exception = new ServiceUnavailableError({
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

  const isSerializableHeaderValue = (value: any): boolean =>
    value !== undefined &&
    value !== null &&
    value !== "" &&
    (!Object.getOwnPropertyNames(value).includes("length") ||
      value.length != 0) &&
    (!Object.getOwnPropertyNames(value).includes("size") || value.size != 0);
