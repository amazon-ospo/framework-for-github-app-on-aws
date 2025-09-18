// @ts-nocheck
// smithy-typescript generated code
import { AppFrameworkClient } from "../AppFrameworkClient";
import {
  GetInstallationsCommand,
  GetInstallationsCommandInput,
  GetInstallationsCommandOutput,
} from "../commands/GetInstallationsCommand";
import { AppFrameworkPaginationConfiguration } from "./Interfaces";
import { createPaginator } from "@smithy/core";
import { Paginator } from "@smithy/types";

/**
 * @public
 */
export const paginateGetInstallations: (
    config: AppFrameworkPaginationConfiguration,
    input: GetInstallationsCommandInput,
    ...rest: any[]
) => Paginator<GetInstallationsCommandOutput> =
    createPaginator<AppFrameworkPaginationConfiguration, GetInstallationsCommandInput, GetInstallationsCommandOutput>(
        AppFrameworkClient,
        GetInstallationsCommand,
        "nextToken",
        "nextToken",
        "maxResults"
    );
