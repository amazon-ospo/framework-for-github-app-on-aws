//@ts-nocheck
// smithy-typescript generated code
import {
  AccessDeniedError,
  ClientSideError,
  GatewayTimeoutError,
  GetInstallationTokenInput,
  GetInstallationTokenOutput,
  RateLimitError,
  ServerSideError,
  ServiceUnavailableError,
} from "../../models/models_0";
import {
  deserializeGetInstallationTokenRequest,
  serializeAccessDeniedErrorError,
  serializeClientSideErrorError,
  serializeFrameworkException,
  serializeGatewayTimeoutErrorError,
  serializeGetInstallationTokenResponse,
  serializeRateLimitErrorError,
  serializeServerSideErrorError,
  serializeServiceUnavailableErrorError,
} from "../../protocols/Aws_restJson1";
import { AppFrameworkService } from "../AppFrameworkService";
import {
  ServerSerdeContext,
  ServiceException as __BaseException,
  InternalFailureException as __InternalFailureException,
  Mux as __Mux,
  Operation as __Operation,
  OperationInput as __OperationInput,
  OperationOutput as __OperationOutput,
  OperationSerializer as __OperationSerializer,
  SerializationException as __SerializationException,
  ServerSerdeContext as __ServerSerdeContext,
  ServiceException as __ServiceException,
  ServiceHandler as __ServiceHandler,
  SmithyFrameworkException as __SmithyFrameworkException,
  ValidationCustomizer as __ValidationCustomizer,
  ValidationFailure as __ValidationFailure,
  isFrameworkException as __isFrameworkException,
  httpbinding,
} from "@aws-smithy/server-common";
import {
  NodeHttpHandler,
  streamCollector,
} from "@smithy/node-http-handler";
import {
  HttpRequest as __HttpRequest,
  HttpResponse as __HttpResponse,
} from "@smithy/protocol-http";
import {
  fromBase64,
  toBase64,
} from "@smithy/util-base64";
import {
  fromUtf8,
  toUtf8,
} from "@smithy/util-utf8";

export type GetInstallationToken<Context> = __Operation<GetInstallationTokenServerInput, GetInstallationTokenServerOutput, Context>

export interface GetInstallationTokenServerInput extends GetInstallationTokenInput {}
export namespace GetInstallationTokenServerInput {
  /**
   * @internal
   */
  export const validate: (obj: Parameters<typeof GetInstallationTokenInput.validate>[0]) => __ValidationFailure[] = GetInstallationTokenInput.validate;
}
export interface GetInstallationTokenServerOutput extends GetInstallationTokenOutput {}

export type GetInstallationTokenErrors = ServerSideError | ClientSideError | AccessDeniedError | RateLimitError | GatewayTimeoutError | ServiceUnavailableError

export class GetInstallationTokenSerializer implements __OperationSerializer<AppFrameworkService<any>, "GetInstallationToken", GetInstallationTokenErrors> {
  serialize = serializeGetInstallationTokenResponse;
  deserialize = deserializeGetInstallationTokenRequest;

  isOperationError(error: any): error is GetInstallationTokenErrors {
    const names: GetInstallationTokenErrors['name'][] = ["ServerSideError", "ClientSideError", "AccessDeniedError", "RateLimitError", "GatewayTimeoutError", "ServiceUnavailableError"];
    return names.includes(error.name);
  };

  serializeError(error: GetInstallationTokenErrors, ctx: ServerSerdeContext): Promise<__HttpResponse> {
    switch (error.name) {
      case "ServerSideError": {
        return serializeServerSideErrorError(error, ctx);
      }
      case "ClientSideError": {
        return serializeClientSideErrorError(error, ctx);
      }
      case "AccessDeniedError": {
        return serializeAccessDeniedErrorError(error, ctx);
      }
      case "RateLimitError": {
        return serializeRateLimitErrorError(error, ctx);
      }
      case "GatewayTimeoutError": {
        return serializeGatewayTimeoutErrorError(error, ctx);
      }
      case "ServiceUnavailableError": {
        return serializeServiceUnavailableErrorError(error, ctx);
      }
      default: {
        throw error;
      }
    }
  }

}

export const getGetInstallationTokenHandler = <Context>(operation: __Operation<GetInstallationTokenServerInput, GetInstallationTokenServerOutput, Context>, customizer: __ValidationCustomizer<"GetInstallationToken">): __ServiceHandler<Context, __HttpRequest, __HttpResponse> => {
  const mux = new httpbinding.HttpBindingMux<"AppFramework", "GetInstallationToken">([
    new httpbinding.UriSpec<"AppFramework", "GetInstallationToken">(
      'POST',
      [
        { type: 'path_literal', value: "tokens" },
        { type: 'path_literal', value: "installation" },
      ],
      [
      ],
      { service: "AppFramework", operation: "GetInstallationToken" }),
  ]);
  return new GetInstallationTokenHandler(operation, mux, new GetInstallationTokenSerializer(), serializeFrameworkException, customizer);
}

const serdeContextBase = {
  base64Encoder: toBase64,
  base64Decoder: fromBase64,
  utf8Encoder: toUtf8,
  utf8Decoder: fromUtf8,
  streamCollector: streamCollector,
  requestHandler: new NodeHttpHandler(),
  disableHostPrefix: true
};
async function handle<S, O extends keyof S & string, Context>(
  request: __HttpRequest,
  context: Context,
  operationName: O,
  serializer: __OperationSerializer<S, O, __ServiceException>,
  operation: __Operation<__OperationInput<S[O]>, __OperationOutput<S[O]>, Context>,
  serializeFrameworkException: (e: __SmithyFrameworkException, ctx: __ServerSerdeContext) => Promise<__HttpResponse>,
  validationFn: (input: __OperationInput<S[O]>) => __ValidationFailure[],
  validationCustomizer: __ValidationCustomizer<O>
): Promise<__HttpResponse> {
  let input;
  try {
    input = await serializer.deserialize(request, {
      endpoint: () => Promise.resolve(request), ...serdeContextBase
    });
  } catch (error: unknown) {
    if (__isFrameworkException(error)) {
      return serializeFrameworkException(error, serdeContextBase);
    };
    return serializeFrameworkException(new __SerializationException(), serdeContextBase);
  }
  try {
    let validationFailures = validationFn(input);
    if (validationFailures && validationFailures.length > 0) {
      let validationException = validationCustomizer({ operation: operationName }, validationFailures);
      if (validationException) {
        return serializer.serializeError(validationException, serdeContextBase);
      }
    }
    let output = await operation(input, context);
    return serializer.serialize(output, serdeContextBase);
  } catch(error: unknown) {
    if (serializer.isOperationError(error)) {
      return serializer.serializeError(error, serdeContextBase);
    }
    console.log('Received an unexpected error', error);
    return serializeFrameworkException(new __InternalFailureException(), serdeContextBase);
  }
}
export class GetInstallationTokenHandler<Context> implements __ServiceHandler<Context> {
  private readonly operation: __Operation<GetInstallationTokenServerInput, GetInstallationTokenServerOutput, Context>;
  private readonly mux: __Mux<"AppFramework", "GetInstallationToken">;
  private readonly serializer: __OperationSerializer<AppFrameworkService<Context>, "GetInstallationToken", GetInstallationTokenErrors>;
  private readonly serializeFrameworkException: (e: __SmithyFrameworkException, ctx: __ServerSerdeContext) => Promise<__HttpResponse>;
  private readonly validationCustomizer: __ValidationCustomizer<"GetInstallationToken">;
  /**
   * Construct a GetInstallationToken handler.
   * @param operation The {@link __Operation} implementation that supplies the business logic for GetInstallationToken
   * @param mux The {@link __Mux} that verifies which service and operation are being invoked by a given {@link __HttpRequest}
   * @param serializer An {@link __OperationSerializer} for GetInstallationToken that
   *                   handles deserialization of requests and serialization of responses
   * @param serializeFrameworkException A function that can serialize {@link __SmithyFrameworkException}s
   * @param validationCustomizer A {@link __ValidationCustomizer} for turning validation failures into {@link __SmithyFrameworkException}s
   */
  constructor(
    operation: __Operation<GetInstallationTokenServerInput, GetInstallationTokenServerOutput, Context>,
    mux: __Mux<"AppFramework", "GetInstallationToken">,
    serializer: __OperationSerializer<AppFrameworkService<Context>, "GetInstallationToken", GetInstallationTokenErrors>,
    serializeFrameworkException: (e: __SmithyFrameworkException, ctx: __ServerSerdeContext) => Promise<__HttpResponse>,
    validationCustomizer: __ValidationCustomizer<"GetInstallationToken">
  ) {
    this.operation = operation;
    this.mux = mux;
    this.serializer = serializer;
    this.serializeFrameworkException = serializeFrameworkException;
    this.validationCustomizer = validationCustomizer;
  }
  async handle(request: __HttpRequest, context: Context): Promise<__HttpResponse> {
    const target = this.mux.match(request);
    if (target === undefined) {
      console.log('Received a request that did not match framework.api#AppFramework.GetInstallationToken. This indicates a misconfiguration.');
      return this.serializeFrameworkException(new __InternalFailureException(), serdeContextBase);
    }
    return handle(request, context, "GetInstallationToken", this.serializer, this.operation, this.serializeFrameworkException, GetInstallationTokenServerInput.validate, this.validationCustomizer);
  }
}
