// smithy-typescript generated code
import { HttpAuthExtensionConfiguration } from "./auth/httpAuthExtensionConfiguration";
import { AwsRegionExtensionConfiguration } from "@aws-sdk/types";
import { HttpHandlerExtensionConfiguration } from "@smithy/protocol-http";
import { DefaultExtensionConfiguration } from "@smithy/types";

/**
 * @internal
 */
export interface AppFrameworkExtensionConfiguration extends HttpHandlerExtensionConfiguration, DefaultExtensionConfiguration, AwsRegionExtensionConfiguration, HttpAuthExtensionConfiguration {}
