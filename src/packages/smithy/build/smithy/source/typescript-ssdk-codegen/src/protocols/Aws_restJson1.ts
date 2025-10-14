// @ts-nocheck
// smithy-typescript generated code
import {
  ClientSideError,
  InstallationData,
  InstallationRecord,
  ScopeDown,
  ServerSideError,
  ValidationException,
  ValidationExceptionField,
} from "../models/models_0";
import {
  GetAppTokenServerInput,
  GetAppTokenServerOutput,
} from "../server/operations/GetAppToken";
import {
  GetInstallationDataServerInput,
  GetInstallationDataServerOutput,
} from "../server/operations/GetInstallationData";
import {
  GetInstallationTokenServerInput,
  GetInstallationTokenServerOutput,
} from "../server/operations/GetInstallationToken";
import {
  GetInstallationsServerInput,
  GetInstallationsServerOutput,
} from "../server/operations/GetInstallations";
import {
  RefreshCachedDataServerInput,
  RefreshCachedDataServerOutput,
} from "../server/operations/RefreshCachedData";
import {
  loadRestJsonErrorCode,
  parseJsonBody as parseBody,
  parseJsonErrorBody as parseErrorBody,
} from "@aws-sdk/core";
import {
  ServerSerdeContext,
  ServiceException as __BaseException,
  NotAcceptableException as __NotAcceptableException,
  SmithyFrameworkException as __SmithyFrameworkException,
  UnsupportedMediaTypeException as __UnsupportedMediaTypeException,
  acceptMatches as __acceptMatches,
} from "@aws-smithy/server-common";
import {
  HttpRequest as __HttpRequest,
  HttpResponse as __HttpResponse,
} from "@smithy/protocol-http";
import {
  expectInt32 as __expectInt32,
  expectNonNull as __expectNonNull,
  expectObject as __expectObject,
  expectString as __expectString,
  serializeDateTime as __serializeDateTime,
  _json,
  collectBody,
  isSerializableHeaderValue,
  map,
  take,
} from "@smithy/smithy-client";
import {
  Endpoint as __Endpoint,
  ResponseMetadata as __ResponseMetadata,
  SerdeContext as __SerdeContext,
} from "@smithy/types";
import { calculateBodyLength } from "@smithy/util-body-length-node";

export const deserializeGetAppTokenRequest = async(
  output: __HttpRequest,
  context: __SerdeContext
): Promise<GetAppTokenServerInput> => {
  const contentTypeHeaderKey: string | undefined = Object.keys(output.headers).find(key => key.toLowerCase() === 'content-type');
  if (contentTypeHeaderKey != null) {
    const contentType = output.headers[contentTypeHeaderKey];
    if (contentType !== undefined && contentType !== "application/json") {
      throw new __UnsupportedMediaTypeException();
    };
  };
  const acceptHeaderKey: string | undefined = Object.keys(output.headers).find(key => key.toLowerCase() === 'accept');
  if (acceptHeaderKey != null) {
    const accept = output.headers[acceptHeaderKey];
    if (!__acceptMatches(accept, "application/json")) {
      throw new __NotAcceptableException();
    };
  };
  const contents: any = map({
  });
  const data: Record<string, any> = __expectNonNull((__expectObject(await parseBody(output.body, context))), "body");
  const doc = take(data, {
    'appId': __expectInt32,
  });
  Object.assign(contents, doc);
  return contents;
}

export const deserializeGetInstallationDataRequest = async(
  output: __HttpRequest,
  context: __SerdeContext
): Promise<GetInstallationDataServerInput> => {
  const contentTypeHeaderKey: string | undefined = Object.keys(output.headers).find(key => key.toLowerCase() === 'content-type');
  if (contentTypeHeaderKey != null) {
    const contentType = output.headers[contentTypeHeaderKey];
    if (contentType !== undefined && contentType !== "application/json") {
      throw new __UnsupportedMediaTypeException();
    };
  };
  const acceptHeaderKey: string | undefined = Object.keys(output.headers).find(key => key.toLowerCase() === 'accept');
  if (acceptHeaderKey != null) {
    const accept = output.headers[acceptHeaderKey];
    if (!__acceptMatches(accept, "application/json")) {
      throw new __NotAcceptableException();
    };
  };
  const contents: any = map({
  });
  const data: Record<string, any> = __expectNonNull((__expectObject(await parseBody(output.body, context))), "body");
  const doc = take(data, {
    'nodeId': __expectString,
  });
  Object.assign(contents, doc);
  return contents;
}

export const deserializeGetInstallationsRequest = async(
  output: __HttpRequest,
  context: __SerdeContext
): Promise<GetInstallationsServerInput> => {
  const contentTypeHeaderKey: string | undefined = Object.keys(output.headers).find(key => key.toLowerCase() === 'content-type');
  if (contentTypeHeaderKey != null) {
    const contentType = output.headers[contentTypeHeaderKey];
    if (contentType !== undefined && contentType !== "application/json") {
      throw new __UnsupportedMediaTypeException();
    };
  };
  const acceptHeaderKey: string | undefined = Object.keys(output.headers).find(key => key.toLowerCase() === 'accept');
  if (acceptHeaderKey != null) {
    const accept = output.headers[acceptHeaderKey];
    if (!__acceptMatches(accept, "application/json")) {
      throw new __NotAcceptableException();
    };
  };
  const contents: any = map({
  });
  const data: Record<string, any> = __expectNonNull((__expectObject(await parseBody(output.body, context))), "body");
  const doc = take(data, {
    'maxResults': __expectInt32,
    'nextToken': __expectString,
  });
  Object.assign(contents, doc);
  return contents;
}

export const deserializeGetInstallationTokenRequest = async(
  output: __HttpRequest,
  context: __SerdeContext
): Promise<GetInstallationTokenServerInput> => {
  const contentTypeHeaderKey: string | undefined = Object.keys(output.headers).find(key => key.toLowerCase() === 'content-type');
  if (contentTypeHeaderKey != null) {
    const contentType = output.headers[contentTypeHeaderKey];
    if (contentType !== undefined && contentType !== "application/json") {
      throw new __UnsupportedMediaTypeException();
    };
  };
  const acceptHeaderKey: string | undefined = Object.keys(output.headers).find(key => key.toLowerCase() === 'accept');
  if (acceptHeaderKey != null) {
    const accept = output.headers[acceptHeaderKey];
    if (!__acceptMatches(accept, "application/json")) {
      throw new __NotAcceptableException();
    };
  };
  const contents: any = map({
  });
  const data: Record<string, any> = __expectNonNull((__expectObject(await parseBody(output.body, context))), "body");
  const doc = take(data, {
    'appId': __expectInt32,
    'nodeId': __expectString,
    'scopeDown': _ => de_ScopeDown(_, context),
  });
  Object.assign(contents, doc);
  return contents;
}

export const deserializeRefreshCachedDataRequest = async(
  output: __HttpRequest,
  context: __SerdeContext
): Promise<RefreshCachedDataServerInput> => {
  const contentTypeHeaderKey: string | undefined = Object.keys(output.headers).find(key => key.toLowerCase() === 'content-type');
  if (contentTypeHeaderKey != null) {
    const contentType = output.headers[contentTypeHeaderKey];
    if (contentType !== undefined && contentType !== "application/json") {
      throw new __UnsupportedMediaTypeException();
    };
  };
  const acceptHeaderKey: string | undefined = Object.keys(output.headers).find(key => key.toLowerCase() === 'accept');
  if (acceptHeaderKey != null) {
    const accept = output.headers[acceptHeaderKey];
    if (!__acceptMatches(accept, "application/json")) {
      throw new __NotAcceptableException();
    };
  };
  const contents: any = map({
  });
  await collectBody(output.body, context);
  return contents;
}

export const serializeGetAppTokenResponse = async(
  input: GetAppTokenServerOutput,
  ctx: ServerSerdeContext
): Promise<__HttpResponse> => {
  const context: __SerdeContext = {
    ...ctx,
    endpoint: () => Promise.resolve({
      protocol: '',
      hostname: '',
      path: '',
    }),
  }
  let statusCode: number = 200
  let headers: any = map({}, isSerializableHeaderValue, {
    'content-type': 'application/json',
  });
  let body: any;
  body = JSON.stringify(take(input, {
    'appId': [],
    'appToken': [],
    'expirationTime': _ => __serializeDateTime(_),
  }));
  if (body && Object.keys(headers).map((str) => str.toLowerCase()).indexOf('content-length') === -1) {
    const length = calculateBodyLength(body);
    if (length !== undefined) {
      headers = { ...headers, 'content-length': String(length) };
    }
  }
  return new __HttpResponse({
    headers,
    body,
    statusCode,
  });
}

export const serializeGetInstallationDataResponse = async(
  input: GetInstallationDataServerOutput,
  ctx: ServerSerdeContext
): Promise<__HttpResponse> => {
  const context: __SerdeContext = {
    ...ctx,
    endpoint: () => Promise.resolve({
      protocol: '',
      hostname: '',
      path: '',
    }),
  }
  let statusCode: number = 200
  let headers: any = map({}, isSerializableHeaderValue, {
    'content-type': 'application/json',
  });
  let body: any;
  body = JSON.stringify(take(input, {
    'installations': _ => se_InstallationDataList(_, context),
  }));
  if (body && Object.keys(headers).map((str) => str.toLowerCase()).indexOf('content-length') === -1) {
    const length = calculateBodyLength(body);
    if (length !== undefined) {
      headers = { ...headers, 'content-length': String(length) };
    }
  }
  return new __HttpResponse({
    headers,
    body,
    statusCode,
  });
}

export const serializeGetInstallationsResponse = async(
  input: GetInstallationsServerOutput,
  ctx: ServerSerdeContext
): Promise<__HttpResponse> => {
  const context: __SerdeContext = {
    ...ctx,
    endpoint: () => Promise.resolve({
      protocol: '',
      hostname: '',
      path: '',
    }),
  }
  let statusCode: number = 200
  let headers: any = map({}, isSerializableHeaderValue, {
    'content-type': 'application/json',
  });
  let body: any;
  body = JSON.stringify(take(input, {
    'installations': _ => se_InstallationRecordList(_, context),
    'nextToken': [],
  }));
  if (body && Object.keys(headers).map((str) => str.toLowerCase()).indexOf('content-length') === -1) {
    const length = calculateBodyLength(body);
    if (length !== undefined) {
      headers = { ...headers, 'content-length': String(length) };
    }
  }
  return new __HttpResponse({
    headers,
    body,
    statusCode,
  });
}

export const serializeGetInstallationTokenResponse = async(
  input: GetInstallationTokenServerOutput,
  ctx: ServerSerdeContext
): Promise<__HttpResponse> => {
  const context: __SerdeContext = {
    ...ctx,
    endpoint: () => Promise.resolve({
      protocol: '',
      hostname: '',
      path: '',
    }),
  }
  let statusCode: number = 200
  let headers: any = map({}, isSerializableHeaderValue, {
    'content-type': 'application/json',
  });
  let body: any;
  body = JSON.stringify(take(input, {
    'actualScopeDown': _ => se_ScopeDown(_, context),
    'appId': [],
    'expirationTime': _ => __serializeDateTime(_),
    'installationToken': [],
    'nodeId': [],
    'requestedScopeDown': _ => se_ScopeDown(_, context),
  }));
  if (body && Object.keys(headers).map((str) => str.toLowerCase()).indexOf('content-length') === -1) {
    const length = calculateBodyLength(body);
    if (length !== undefined) {
      headers = { ...headers, 'content-length': String(length) };
    }
  }
  return new __HttpResponse({
    headers,
    body,
    statusCode,
  });
}

export const serializeRefreshCachedDataResponse = async(
  input: RefreshCachedDataServerOutput,
  ctx: ServerSerdeContext
): Promise<__HttpResponse> => {
  const context: __SerdeContext = {
    ...ctx,
    endpoint: () => Promise.resolve({
      protocol: '',
      hostname: '',
      path: '',
    }),
  }
  let statusCode: number = 200
  let headers: any = map({}, isSerializableHeaderValue, {
    'content-type': 'application/json',
  });
  let body: any;
  body = JSON.stringify(take(input, {
    'message': [],
    'refreshedDate': _ => __serializeDateTime(_),
  }));
  if (body && Object.keys(headers).map((str) => str.toLowerCase()).indexOf('content-length') === -1) {
    const length = calculateBodyLength(body);
    if (length !== undefined) {
      headers = { ...headers, 'content-length': String(length) };
    }
  }
  return new __HttpResponse({
    headers,
    body,
    statusCode,
  });
}

export const serializeFrameworkException = async(
  input: __SmithyFrameworkException,
  ctx: ServerSerdeContext
): Promise<__HttpResponse> => {
  const context: __SerdeContext = {
    ...ctx,
    endpoint: () => Promise.resolve({
      protocol: '',
      hostname: '',
      path: '',
    }),
  }
  switch (input.name) {
    case "InternalFailure": {
      const statusCode: number = 500
      let headers: any = map({}, isSerializableHeaderValue, {
        'x-amzn-errortype': "InternalFailure",
        'content-type': 'application/json',
      });
      let body: any;
      body = "{}";
      return new __HttpResponse({
        headers,
        body,
        statusCode,
      });
    }
    case "NotAcceptableException": {
      const statusCode: number = 406
      let headers: any = map({}, isSerializableHeaderValue, {
        'x-amzn-errortype': "NotAcceptableException",
        'content-type': 'application/json',
      });
      let body: any;
      body = "{}";
      return new __HttpResponse({
        headers,
        body,
        statusCode,
      });
    }
    case "SerializationException": {
      const statusCode: number = 400
      let headers: any = map({}, isSerializableHeaderValue, {
        'x-amzn-errortype': "SerializationException",
        'content-type': 'application/json',
      });
      let body: any;
      body = "{}";
      return new __HttpResponse({
        headers,
        body,
        statusCode,
      });
    }
    case "UnknownOperationException": {
      const statusCode: number = 404
      let headers: any = map({}, isSerializableHeaderValue, {
        'x-amzn-errortype': "UnknownOperationException",
        'content-type': 'application/json',
      });
      let body: any;
      body = "{}";
      return new __HttpResponse({
        headers,
        body,
        statusCode,
      });
    }
    case "UnsupportedMediaTypeException": {
      const statusCode: number = 415
      let headers: any = map({}, isSerializableHeaderValue, {
        'x-amzn-errortype': "UnsupportedMediaTypeException",
        'content-type': 'application/json',
      });
      let body: any;
      body = "{}";
      return new __HttpResponse({
        headers,
        body,
        statusCode,
      });
    }
  }
}

export const serializeClientSideErrorError = async(
  input: ClientSideError,
  ctx: ServerSerdeContext
): Promise<__HttpResponse> => {
  const context: __SerdeContext = {
    ...ctx,
    endpoint: () => Promise.resolve({
      protocol: '',
      hostname: '',
      path: '',
    }),
  }
  const statusCode: number = 400
  let headers: any = map({}, isSerializableHeaderValue, {
    'x-amzn-errortype': "ClientSideError",
    'content-type': 'application/json',
  });
  let body: any;
  body = JSON.stringify(take(input, {
    'message': [],
  }));
  return new __HttpResponse({
    headers,
    body,
    statusCode,
  });
}

export const serializeServerSideErrorError = async(
  input: ServerSideError,
  ctx: ServerSerdeContext
): Promise<__HttpResponse> => {
  const context: __SerdeContext = {
    ...ctx,
    endpoint: () => Promise.resolve({
      protocol: '',
      hostname: '',
      path: '',
    }),
  }
  const statusCode: number = 500
  let headers: any = map({}, isSerializableHeaderValue, {
    'x-amzn-errortype': "ServerSideError",
    'content-type': 'application/json',
  });
  let body: any;
  body = JSON.stringify(take(input, {
    'message': [],
  }));
  return new __HttpResponse({
    headers,
    body,
    statusCode,
  });
}

export const serializeValidationExceptionError = async(
  input: ValidationException,
  ctx: ServerSerdeContext
): Promise<__HttpResponse> => {
  const context: __SerdeContext = {
    ...ctx,
    endpoint: () => Promise.resolve({
      protocol: '',
      hostname: '',
      path: '',
    }),
  }
  const statusCode: number = 400
  let headers: any = map({}, isSerializableHeaderValue, {
    'x-amzn-errortype': "ValidationException",
    'content-type': 'application/json',
  });
  let body: any;
  body = JSON.stringify(take(input, {
    'fieldList': _ => se_ValidationExceptionFieldList(_, context),
    'message': [],
  }));
  return new __HttpResponse({
    headers,
    body,
    statusCode,
  });
}

/**
 * serializeAws_restJson1InstallationData
 */
const se_InstallationData = (
  input: InstallationData,
  context: __SerdeContext
): any => {
  return take(input, {
    'appId': [],
    'installationId': [],
    'nodeId': [],
  });
}

/**
 * serializeAws_restJson1InstallationDataList
 */
const se_InstallationDataList = (
  input: (InstallationData)[],
  context: __SerdeContext
): any => {
  return input.filter((e: any) => e != null).map(entry => {
    return se_InstallationData(entry, context);
  });
}

/**
 * serializeAws_restJson1InstallationRecord
 */
const se_InstallationRecord = (
  input: InstallationRecord,
  context: __SerdeContext
): any => {
  return take(input, {
    'appId': [],
    'installationId': [],
    'name': [],
    'nodeId': [],
    'targetType': [],
  });
}

/**
 * serializeAws_restJson1InstallationRecordList
 */
const se_InstallationRecordList = (
  input: (InstallationRecord)[],
  context: __SerdeContext
): any => {
  return input.filter((e: any) => e != null).map(entry => {
    return se_InstallationRecord(entry, context);
  });
}

/**
 * serializeAws_restJson1Permissions
 */
const se_Permissions = (
  input: Record<string, string>,
  context: __SerdeContext
): any => {
  return Object.entries(input).reduce((acc: Record<string, any>, [key, value]: [string, any]) => {
    if (value === null) {
      return acc;
    }
    acc[key] = value;
    return acc;
  }, {});
}

/**
 * serializeAws_restJson1RepositoryIds
 */
const se_RepositoryIds = (
  input: (number)[],
  context: __SerdeContext
): any => {
  return input.filter((e: any) => e != null);
}

/**
 * serializeAws_restJson1RepositoryNames
 */
const se_RepositoryNames = (
  input: (string)[],
  context: __SerdeContext
): any => {
  return input.filter((e: any) => e != null);
}

/**
 * serializeAws_restJson1ScopeDown
 */
const se_ScopeDown = (
  input: ScopeDown,
  context: __SerdeContext
): any => {
  return take(input, {
    'permissions': _ => se_Permissions(_, context),
    'repositoryIds': _ => se_RepositoryIds(_, context),
    'repositoryNames': _ => se_RepositoryNames(_, context),
  });
}

/**
 * serializeAws_restJson1ValidationExceptionField
 */
const se_ValidationExceptionField = (
  input: ValidationExceptionField,
  context: __SerdeContext
): any => {
  return take(input, {
    'message': [],
    'path': [],
  });
}

/**
 * serializeAws_restJson1ValidationExceptionFieldList
 */
const se_ValidationExceptionFieldList = (
  input: (ValidationExceptionField)[],
  context: __SerdeContext
): any => {
  return input.filter((e: any) => e != null).map(entry => {
    return se_ValidationExceptionField(entry, context);
  });
}

/**
 * deserializeAws_restJson1Permissions
 */
const de_Permissions = (
  output: any,
  context: __SerdeContext
): Record<string, string> => {
  return Object.entries(output).reduce((acc: Record<string, string>, [key, value]: [string, any]) => {
    if (value === null) {
      return acc;
    }
    acc[key as string] = __expectString(value) as any;
    return acc;

  }, {} as Record<string, string>);}

/**
 * deserializeAws_restJson1RepositoryIds
 */
const de_RepositoryIds = (
  output: any,
  context: __SerdeContext
): (number)[] => {
  const retVal = (output || []).map((entry: any) => {
    if (entry === null) {
      throw new TypeError('All elements of the non-sparse list "framework.api#RepositoryIds" must be non-null.');
    }
    return __expectInt32(entry) as any;
  });
  return retVal;
}

/**
 * deserializeAws_restJson1RepositoryNames
 */
const de_RepositoryNames = (
  output: any,
  context: __SerdeContext
): (string)[] => {
  const retVal = (output || []).map((entry: any) => {
    if (entry === null) {
      throw new TypeError('All elements of the non-sparse list "framework.api#RepositoryNames" must be non-null.');
    }
    return __expectString(entry) as any;
  });
  return retVal;
}

/**
 * deserializeAws_restJson1ScopeDown
 */
const de_ScopeDown = (
  output: any,
  context: __SerdeContext
): ScopeDown => {
  return take(output, {
    'permissions': (_: any) => de_Permissions(_, context),
    'repositoryIds': (_: any) => de_RepositoryIds(_, context),
    'repositoryNames': (_: any) => de_RepositoryNames(_, context),
  }) as any;
}

const deserializeMetadata = (output: __HttpResponse): __ResponseMetadata => ({
  httpStatusCode: output.statusCode,
  requestId: output.headers["x-amzn-requestid"] ?? output.headers["x-amzn-request-id"] ?? output.headers["x-amz-request-id"],
  extendedRequestId: output.headers["x-amz-id-2"],
  cfId: output.headers["x-amz-cf-id"],
});

// Encode Uint8Array data into string with utf-8.
const collectBodyString = (streamBody: any, context: __SerdeContext): Promise<string> => collectBody(streamBody, context).then(body => context.utf8Encoder(body))
