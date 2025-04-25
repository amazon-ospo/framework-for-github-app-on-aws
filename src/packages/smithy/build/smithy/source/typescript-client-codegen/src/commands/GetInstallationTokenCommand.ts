// @ts-nocheck
// smithy-typescript generated code
import {
  AppFrameworkClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../AppFrameworkClient";
import {
  GetInstallationTokenInput,
  GetInstallationTokenOutput,
} from "../models/models_0";
import {
  de_GetInstallationTokenCommand,
  se_GetInstallationTokenCommand,
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
 * The input for {@link GetInstallationTokenCommand}.
 */
export interface GetInstallationTokenCommandInput extends GetInstallationTokenInput {}
/**
 * @public
 *
 * The output of {@link GetInstallationTokenCommand}.
 */
export interface GetInstallationTokenCommandOutput extends GetInstallationTokenOutput, __MetadataBearer {}

/**
 * @public
 *
 * @example
 * Use a bare-bones client and the command you need to make an API call.
 * ```javascript
 * import { AppFrameworkClient, GetInstallationTokenCommand } from "@aws/app-framework-client"; // ES Modules import
 * // const { AppFrameworkClient, GetInstallationTokenCommand } = require("@aws/app-framework-client"); // CommonJS import
 * const client = new AppFrameworkClient(config);
 * const input = { // GetInstallationTokenInput
 *   appId: Number("int"), // required
 *   nodeId: "STRING_VALUE", // required
 * };
 * const command = new GetInstallationTokenCommand(input);
 * const response = await client.send(command);
 * // { // GetInstallationTokenOutput
 * //   installationToken: "STRING_VALUE",
 * //   nodeId: "STRING_VALUE",
 * //   appId: Number("int"),
 * // };
 *
 * ```
 *
 * @param GetInstallationTokenCommandInput - {@link GetInstallationTokenCommandInput}
 * @returns {@link GetInstallationTokenCommandOutput}
 * @see {@link GetInstallationTokenCommandInput} for command's `input` shape.
 * @see {@link GetInstallationTokenCommandOutput} for command's `response` shape.
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
export class GetInstallationTokenCommand extends $Command.classBuilder<GetInstallationTokenCommandInput, GetInstallationTokenCommandOutput, AppFrameworkClientResolvedConfig, ServiceInputTypes, ServiceOutputTypes>()
      .m(function (this: any, Command: any, cs: any, config: AppFrameworkClientResolvedConfig, o: any) {
          return [

  getSerdePlugin(config, this.serialize, this.deserialize),
      ];
  })
  .s("AppFramework", "GetInstallationToken", {

  })
  .n("AppFrameworkClient", "GetInstallationTokenCommand")
  .f(void 0, void 0)
  .ser(se_GetInstallationTokenCommand)
  .de(de_GetInstallationTokenCommand)
.build() {
/** @internal type navigation helper, not in runtime. */
declare protected static __types: {
  api: {
      input: GetInstallationTokenInput;
      output: GetInstallationTokenOutput;
  };
  sdk: {
      input: GetInstallationTokenCommandInput;
      output: GetInstallationTokenCommandOutput;
  };
};
}
