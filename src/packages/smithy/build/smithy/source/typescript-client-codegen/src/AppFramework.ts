// @ts-nocheck
// smithy-typescript generated code
import {
  AppFrameworkClient,
  AppFrameworkClientConfig,
} from "./AppFrameworkClient";
import {
  GetAppTokenCommand,
  GetAppTokenCommandInput,
  GetAppTokenCommandOutput,
} from "./commands/GetAppTokenCommand";
import {
  GetInstallationTokenCommand,
  GetInstallationTokenCommandInput,
  GetInstallationTokenCommandOutput,
} from "./commands/GetInstallationTokenCommand";
import { createAggregatedClient } from "@smithy/smithy-client";
import { HttpHandlerOptions as __HttpHandlerOptions } from "@smithy/types";

const commands = {
  GetAppTokenCommand,
  GetInstallationTokenCommand,
}

export interface AppFramework {
  /**
   * @see {@link GetAppTokenCommand}
   */
  getAppToken(
    args: GetAppTokenCommandInput,
    options?: __HttpHandlerOptions,
  ): Promise<GetAppTokenCommandOutput>;
  getAppToken(
    args: GetAppTokenCommandInput,
    cb: (err: any, data?: GetAppTokenCommandOutput) => void
  ): void;
  getAppToken(
    args: GetAppTokenCommandInput,
    options: __HttpHandlerOptions,
    cb: (err: any, data?: GetAppTokenCommandOutput) => void
  ): void;

  /**
   * @see {@link GetInstallationTokenCommand}
   */
  getInstallationToken(
    args: GetInstallationTokenCommandInput,
    options?: __HttpHandlerOptions,
  ): Promise<GetInstallationTokenCommandOutput>;
  getInstallationToken(
    args: GetInstallationTokenCommandInput,
    cb: (err: any, data?: GetInstallationTokenCommandOutput) => void
  ): void;
  getInstallationToken(
    args: GetInstallationTokenCommandInput,
    options: __HttpHandlerOptions,
    cb: (err: any, data?: GetInstallationTokenCommandOutput) => void
  ): void;

}

/**
 * @public
 */
export class AppFramework extends AppFrameworkClient implements AppFramework {}
createAggregatedClient(commands, AppFramework);
