// @ts-nocheck
// smithy-typescript generated code
import {
  AccessDeniedError,
  ClientSideError,
  GatewayTimeoutError,
  GetAppTokenInput,
  GetAppTokenOutput,
  ServerSideError,
  ServiceUnavailableError,
} from "../../models/models_0";
import {
  deserializeGetAppTokenRequest,
  serializeAccessDeniedErrorError,
  serializeClientSideErrorError,
  serializeFrameworkException,
  serializeGatewayTimeoutErrorError,
  serializeGetAppTokenResponse,
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

export type GetAppToken<Context> = __Operation<GetAppTokenServerInput, GetAppTokenServerOutput, Context>

export interface GetAppTokenServerInput extends GetAppTokenInput {}
export namespace GetAppTokenServerInput {
  /**
   * @internal
   */
  export const validate: (obj: Parameters<typeof GetAppTokenInput.validate>[0]) => __ValidationFailure[] = GetAppTokenInput.validate;
}
export interface GetAppTokenServerOutput extends GetAppTokenOutput {}

export type GetAppTokenErrors = ServerSideError | ClientSideError | AccessDeniedError | GatewayTimeoutError | ServiceUnavailableError

export class GetAppTokenSerializer implements __OperationSerializer<AppFrameworkService<any>, "GetAppToken", GetAppTokenErrors> {
  serialize = serializeGetAppTokenResponse;
  deserialize = deserializeGetAppTokenRequest;

  isOperationError(error: any): error is GetAppTokenErrors {
    const names: GetAppTokenErrors['name'][] = ["ServerSideError", "ClientSideError", "AccessDeniedError", "GatewayTimeoutError", "ServiceUnavailableError"];
    return names.includes(error.name);
  };

  serializeError(error: GetAppTokenErrors, ctx: ServerSerdeContext): Promise<__HttpResponse> {
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

export const getGetAppTokenHandler = <Context>(operation: __Operation<GetAppTokenServerInput, GetAppTokenServerOutput, Context>, customizer: __ValidationCustomizer<"GetAppToken">): __ServiceHandler<Context, __HttpRequest, __HttpResponse> => {
  const mux = new httpbinding.HttpBindingMux<"AppFramework", "GetAppToken">([
    new httpbinding.UriSpec<"AppFramework", "GetAppToken">(
      'POST',
      [
        { type: 'path_literal', value: "tokens" },
        { type: 'path_literal', value: "app" },
      ],
      [
      ],
      { service: "AppFramework", operation: "GetAppToken" }),
  ]);
  return new GetAppTokenHandler(operation, mux, new GetAppTokenSerializer(), serializeFrameworkException, customizer);
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
export class GetAppTokenHandler<Context> implements __ServiceHandler<Context> {
  private readonly operation: __Operation<GetAppTokenServerInput, GetAppTokenServerOutput, Context>;
  private readonly mux: __Mux<"AppFramework", "GetAppToken">;
  private readonly serializer: __OperationSerializer<AppFrameworkService<Context>, "GetAppToken", GetAppTokenErrors>;
  private readonly serializeFrameworkException: (e: __SmithyFrameworkException, ctx: __ServerSerdeContext) => Promise<__HttpResponse>;
  private readonly validationCustomizer: __ValidationCustomizer<"GetAppToken">;
  /**
   * Construct a GetAppToken handler.
   * @param operation The {@link __Operation} implementation that supplies the business logic for GetAppToken
   * @param mux The {@link __Mux} that verifies which service and operation are being invoked by a given {@link __HttpRequest}
   * @param serializer An {@link __OperationSerializer} for GetAppToken that
   *                   handles deserialization of requests and serialization of responses
   * @param serializeFrameworkException A function that can serialize {@link __SmithyFrameworkException}s
   * @param validationCustomizer A {@link __ValidationCustomizer} for turning validation failures into {@link __SmithyFrameworkException}s
   */
  constructor(
    operation: __Operation<GetAppTokenServerInput, GetAppTokenServerOutput, Context>,
    mux: __Mux<"AppFramework", "GetAppToken">,
    serializer: __OperationSerializer<AppFrameworkService<Context>, "GetAppToken", GetAppTokenErrors>,
    serializeFrameworkException: (e: __SmithyFrameworkException, ctx: __ServerSerdeContext) => Promise<__HttpResponse>,
    validationCustomizer: __ValidationCustomizer<"GetAppToken">
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
      console.log('Received a request that did not match framework.api#AppFramework.GetAppToken. This indicates a misconfiguration.');
      return this.serializeFrameworkException(new __InternalFailureException(), serdeContextBase);
    }
    return handle(request, context, "GetAppToken", this.serializer, this.operation, this.serializeFrameworkException, GetAppTokenServerInput.validate, this.validationCustomizer);
  }
}
