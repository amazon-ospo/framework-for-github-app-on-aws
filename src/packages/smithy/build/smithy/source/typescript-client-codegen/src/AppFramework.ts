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
  GetInstallationDataCommand,
  GetInstallationDataCommandInput,
  GetInstallationDataCommandOutput,
} from "./commands/GetInstallationDataCommand";
import {
  GetInstallationTokenCommand,
  GetInstallationTokenCommandInput,
  GetInstallationTokenCommandOutput,
} from "./commands/GetInstallationTokenCommand";
import {
  RefreshCachedDataCommand,
  RefreshCachedDataCommandInput,
  RefreshCachedDataCommandOutput,
} from "./commands/RefreshCachedDataCommand";
import { createAggregatedClient } from "@smithy/smithy-client";
import { HttpHandlerOptions as __HttpHandlerOptions } from "@smithy/types";

const commands = {
  GetAppTokenCommand,
  GetInstallationDataCommand,
  GetInstallationTokenCommand,
  RefreshCachedDataCommand,
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
   * @see {@link GetInstallationDataCommand}
   */
  getInstallationData(
    args: GetInstallationDataCommandInput,
    options?: __HttpHandlerOptions,
  ): Promise<GetInstallationDataCommandOutput>;
  getInstallationData(
    args: GetInstallationDataCommandInput,
    cb: (err: any, data?: GetInstallationDataCommandOutput) => void
  ): void;
  getInstallationData(
    args: GetInstallationDataCommandInput,
    options: __HttpHandlerOptions,
    cb: (err: any, data?: GetInstallationDataCommandOutput) => void
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

  /**
   * @see {@link RefreshCachedDataCommand}
   */
  refreshCachedData(): Promise<RefreshCachedDataCommandOutput>;
  refreshCachedData(
    args: RefreshCachedDataCommandInput,
    options?: __HttpHandlerOptions,
  ): Promise<RefreshCachedDataCommandOutput>;
  refreshCachedData(
    args: RefreshCachedDataCommandInput,
    cb: (err: any, data?: RefreshCachedDataCommandOutput) => void
  ): void;
  refreshCachedData(
    args: RefreshCachedDataCommandInput,
    options: __HttpHandlerOptions,
    cb: (err: any, data?: RefreshCachedDataCommandOutput) => void
  ): void;

}

/**
 * @public
 */
export class AppFramework extends AppFrameworkClient implements AppFramework {}
createAggregatedClient(commands, AppFramework);
