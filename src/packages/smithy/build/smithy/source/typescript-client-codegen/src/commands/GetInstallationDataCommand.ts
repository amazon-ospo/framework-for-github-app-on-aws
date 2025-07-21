// @ts-nocheck
// smithy-typescript generated code
import {
  AppFrameworkClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../AppFrameworkClient";
import {
  GetInstallationDataInput,
  GetInstallationDataOutput,
} from "../models/models_0";
import {
  de_GetInstallationDataCommand,
  se_GetInstallationDataCommand,
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
 * The input for {@link GetInstallationDataCommand}.
 */
export interface GetInstallationDataCommandInput extends GetInstallationDataInput {}
/**
 * @public
 *
 * The output of {@link GetInstallationDataCommand}.
 */
export interface GetInstallationDataCommandOutput extends GetInstallationDataOutput, __MetadataBearer {}

/**
 * @public
 *
 * @example
 * Use a bare-bones client and the command you need to make an API call.
 * ```javascript
 * import { AppFrameworkClient, GetInstallationDataCommand } from "@aws/app-framework-for-github-apps-on-aws-client"; // ES Modules import
 * // const { AppFrameworkClient, GetInstallationDataCommand } = require("@aws/app-framework-for-github-apps-on-aws-client"); // CommonJS import
 * const client = new AppFrameworkClient(config);
 * const input = { // GetInstallationDataInput
 *   nodeId: "STRING_VALUE", // required
 * };
 * const command = new GetInstallationDataCommand(input);
 * const response = await client.send(command);
 * // { // GetInstallationDataOutput
 * //   installations: [ // InstallationDataList
 * //     { // InstallationData
 * //       nodeId: "STRING_VALUE",
 * //       appId: Number("int"),
 * //       installationId: Number("int"),
 * //     },
 * //   ],
 * // };
 *
 * ```
 *
 * @param GetInstallationDataCommandInput - {@link GetInstallationDataCommandInput}
 * @returns {@link GetInstallationDataCommandOutput}
 * @see {@link GetInstallationDataCommandInput} for command's `input` shape.
 * @see {@link GetInstallationDataCommandOutput} for command's `response` shape.
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
export class GetInstallationDataCommand extends $Command.classBuilder<GetInstallationDataCommandInput, GetInstallationDataCommandOutput, AppFrameworkClientResolvedConfig, ServiceInputTypes, ServiceOutputTypes>()
      .m(function (this: any, Command: any, cs: any, config: AppFrameworkClientResolvedConfig, o: any) {
          return [

  getSerdePlugin(config, this.serialize, this.deserialize),
      ];
  })
  .s("AppFramework", "GetInstallationData", {

  })
  .n("AppFrameworkClient", "GetInstallationDataCommand")
  .f(void 0, void 0)
  .ser(se_GetInstallationDataCommand)
  .de(de_GetInstallationDataCommand)
.build() {
/** @internal type navigation helper, not in runtime. */
declare protected static __types: {
  api: {
      input: GetInstallationDataInput;
      output: GetInstallationDataOutput;
  };
  sdk: {
      input: GetInstallationDataCommandInput;
      output: GetInstallationDataCommandOutput;
  };
};
}
