// smithy-typescript generated code
import { serializeFrameworkException } from "../protocols/Aws_restJson1";
import {
  GetAppToken,
  GetAppTokenSerializer,
  GetAppTokenServerInput,
} from "./operations/GetAppToken";
import {
  GetInstallationToken,
  GetInstallationTokenSerializer,
  GetInstallationTokenServerInput,
} from "./operations/GetInstallationToken";
import {
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
  UnknownOperationException as __UnknownOperationException,
  ValidationCustomizer as __ValidationCustomizer,
  ValidationFailure as __ValidationFailure,
  generateValidationMessage as __generateValidationMessage,
  generateValidationSummary as __generateValidationSummary,
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

export type AppFrameworkServiceOperations = "GetAppToken" | "GetInstallationToken";
export interface AppFrameworkService<Context> {
  GetAppToken: GetAppToken<Context>
  GetInstallationToken: GetInstallationToken<Context>
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
export class AppFrameworkServiceHandler<Context> implements __ServiceHandler<Context> {
  private readonly service: AppFrameworkService<Context>;
  private readonly mux: __Mux<"AppFramework", AppFrameworkServiceOperations>;
  private readonly serializerFactory: <T extends AppFrameworkServiceOperations>(operation: T) => __OperationSerializer<AppFrameworkService<Context>, T, __ServiceException>;
  private readonly serializeFrameworkException: (e: __SmithyFrameworkException, ctx: __ServerSerdeContext) => Promise<__HttpResponse>;
  private readonly validationCustomizer: __ValidationCustomizer<AppFrameworkServiceOperations>;
  /**
   * Construct a AppFrameworkService handler.
   * @param service The {@link AppFrameworkService} implementation that supplies the business logic for AppFrameworkService
   * @param mux The {@link __Mux} that determines which service and operation are being invoked by a given {@link __HttpRequest}
   * @param serializerFactory A factory for an {@link __OperationSerializer} for each operation in AppFrameworkService that
   *                          handles deserialization of requests and serialization of responses
   * @param serializeFrameworkException A function that can serialize {@link __SmithyFrameworkException}s
   * @param validationCustomizer A {@link __ValidationCustomizer} for turning validation failures into {@link __SmithyFrameworkException}s
   */
  constructor(
    service: AppFrameworkService<Context>,
    mux: __Mux<"AppFramework", AppFrameworkServiceOperations>,
    serializerFactory:<T extends AppFrameworkServiceOperations>(op: T) => __OperationSerializer<AppFrameworkService<Context>, T, __ServiceException>,
    serializeFrameworkException: (e: __SmithyFrameworkException, ctx: __ServerSerdeContext) => Promise<__HttpResponse>,
    validationCustomizer: __ValidationCustomizer<AppFrameworkServiceOperations>
  ) {
    this.service = service;
    this.mux = mux;
    this.serializerFactory = serializerFactory;
    this.serializeFrameworkException = serializeFrameworkException;
    this.validationCustomizer = validationCustomizer;
  }
  async handle(request: __HttpRequest, context: Context): Promise<__HttpResponse> {
    const target = this.mux.match(request);
    if (target === undefined) {
      return this.serializeFrameworkException(new __UnknownOperationException(), serdeContextBase);
    }
    switch (target.operation) {
      case "GetAppToken" : {
        return handle(request, context, "GetAppToken", this.serializerFactory("GetAppToken"), this.service.GetAppToken, this.serializeFrameworkException, GetAppTokenServerInput.validate, this.validationCustomizer);
      }
      case "GetInstallationToken" : {
        return handle(request, context, "GetInstallationToken", this.serializerFactory("GetInstallationToken"), this.service.GetInstallationToken, this.serializeFrameworkException, GetInstallationTokenServerInput.validate, this.validationCustomizer);
      }
    }
  }
}

export const getAppFrameworkServiceHandler = <Context>(service: AppFrameworkService<Context>): __ServiceHandler<Context, __HttpRequest, __HttpResponse> => {
  const mux = new httpbinding.HttpBindingMux<"AppFramework", keyof AppFrameworkService<Context>>([
    new httpbinding.UriSpec<"AppFramework", "GetAppToken">(
      'POST',
      [
        { type: 'path_literal', value: "tokens" },
        { type: 'path_literal', value: "app" },
      ],
      [
      ],
      { service: "AppFramework", operation: "GetAppToken" }),
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
  const serFn: (op: AppFrameworkServiceOperations) => __OperationSerializer<AppFrameworkService<Context>, AppFrameworkServiceOperations, __ServiceException> = (op) => {
    switch (op) {
      case "GetAppToken": return new GetAppTokenSerializer();
      case "GetInstallationToken": return new GetInstallationTokenSerializer();
    }
  };
  const customizer: __ValidationCustomizer<AppFrameworkServiceOperations> = (ctx, failures) => {
    if (!failures) {
      return undefined;
    }
    return {
      name: "ValidationException",
      $fault: "client",
      message: __generateValidationSummary(failures),
      fieldList: failures.map(failure => ({
        path: failure.path,
        message: __generateValidationMessage(failure)
      }))
    };
  };
  return new AppFrameworkServiceHandler(service, mux, serFn, serializeFrameworkException, customizer);
}
