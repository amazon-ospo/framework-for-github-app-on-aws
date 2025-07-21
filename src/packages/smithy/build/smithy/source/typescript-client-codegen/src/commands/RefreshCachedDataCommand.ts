// @ts-nocheck
// smithy-typescript generated code
import {
  AppFrameworkClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../AppFrameworkClient";
import {
  RefreshCachedDataInput,
  RefreshCachedDataOutput,
} from "../models/models_0";
import {
  de_RefreshCachedDataCommand,
  se_RefreshCachedDataCommand,
} from "../protocols/Aws_restJson1";
import { getSerdePlugin } from "@smithy/middleware-serde";
import { Command as $Command } from "@smithy/smithy-client";
import { MetadataBearer as __MetadataBearer } from "@smithy/types";

/**
 * @public
 */
export type { __MetadataBearer };
export { $Command };
/**
 * @public
 *
 * The input for {@link RefreshCachedDataCommand}.
 */
export interface RefreshCachedDataCommandInput extends RefreshCachedDataInput {}
/**
 * @public
 *
 * The output of {@link RefreshCachedDataCommand}.
 */
export interface RefreshCachedDataCommandOutput extends RefreshCachedDataOutput, __MetadataBearer {}

/**
 * @public
 *
 * @example
 * Use a bare-bones client and the command you need to make an API call.
 * ```javascript
 * import { AppFrameworkClient, RefreshCachedDataCommand } from "@aws/app-framework-for-github-apps-on-aws-client"; // ES Modules import
 * // const { AppFrameworkClient, RefreshCachedDataCommand } = require("@aws/app-framework-for-github-apps-on-aws-client"); // CommonJS import
 * const client = new AppFrameworkClient(config);
 * const input = {};
 * const command = new RefreshCachedDataCommand(input);
 * const response = await client.send(command);
 * // { // RefreshCachedDataOutput
 * //   message: "STRING_VALUE",
 * //   refreshedDate: new Date("TIMESTAMP"),
 * // };
 *
 * ```
 *
 * @param RefreshCachedDataCommandInput - {@link RefreshCachedDataCommandInput}
 * @returns {@link RefreshCachedDataCommandOutput}
 * @see {@link RefreshCachedDataCommandInput} for command's `input` shape.
 * @see {@link RefreshCachedDataCommandOutput} for command's `response` shape.
 * @see {@link AppFrameworkClientResolvedConfig | config} for AppFrameworkClient's `config` shape.
 *
 * @throws {@link ServerSideError} (server fault)
 *
 * @throws {@link ClientSideError} (client fault)
 *
 * @throws {@link ValidationException} (client fault)
 *  A standard error for input validation failures.
 * This should be thrown by services when a member of the input structure
 * falls outside of the modeled or documented constraints.
 *
 * @throws {@link AppFrameworkServiceException}
 * <p>Base exception class for all service exceptions from AppFramework service.</p>
 *
 *
 */
export class RefreshCachedDataCommand extends $Command.classBuilder<RefreshCachedDataCommandInput, RefreshCachedDataCommandOutput, AppFrameworkClientResolvedConfig, ServiceInputTypes, ServiceOutputTypes>()
      .m(function (this: any, Command: any, cs: any, config: AppFrameworkClientResolvedConfig, o: any) {
          return [

  getSerdePlugin(config, this.serialize, this.deserialize),
      ];
  })
  .s("AppFramework", "RefreshCachedData", {

  })
  .n("AppFrameworkClient", "RefreshCachedDataCommand")
  .f(void 0, void 0)
  .ser(se_RefreshCachedDataCommand)
  .de(de_RefreshCachedDataCommand)
.build() {
/** @internal type navigation helper, not in runtime. */
declare protected static __types: {
  api: {
      input: {};
      output: RefreshCachedDataOutput;
  };
  sdk: {
      input: RefreshCachedDataCommandInput;
      output: RefreshCachedDataCommandOutput;
  };
};
}
