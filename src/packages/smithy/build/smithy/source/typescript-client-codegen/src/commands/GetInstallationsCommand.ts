// @ts-nocheck
// smithy-typescript generated code
import {
  AppFrameworkClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../AppFrameworkClient";
import {
  GetInstallationsInput,
  GetInstallationsOutput,
} from "../models/models_0";
import {
  de_GetInstallationsCommand,
  se_GetInstallationsCommand,
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
 * The input for {@link GetInstallationsCommand}.
 */
export interface GetInstallationsCommandInput extends GetInstallationsInput {}
/**
 * @public
 *
 * The output of {@link GetInstallationsCommand}.
 */
export interface GetInstallationsCommandOutput extends GetInstallationsOutput, __MetadataBearer {}

/**
 * @public
 *
 * @example
 * Use a bare-bones client and the command you need to make an API call.
 * ```javascript
 * import { AppFrameworkClient, GetInstallationsCommand } from "@aws/app-framework-for-github-apps-on-aws-client"; // ES Modules import
 * // const { AppFrameworkClient, GetInstallationsCommand } = require("@aws/app-framework-for-github-apps-on-aws-client"); // CommonJS import
 * const client = new AppFrameworkClient(config);
 * const input = { // GetInstallationsInput
 *   maxResults: Number("int"),
 *   nextToken: "STRING_VALUE",
 * };
 * const command = new GetInstallationsCommand(input);
 * const response = await client.send(command);
 * // { // GetInstallationsOutput
 * //   nextToken: "STRING_VALUE",
 * //   installations: [ // InstallationRecordList
 * //     { // InstallationRecord
 * //       appId: Number("int"),
 * //       installationId: Number("int"),
 * //       nodeId: "STRING_VALUE",
 * //       targetType: "STRING_VALUE",
 * //     },
 * //   ],
 * // };
 *
 * ```
 *
 * @param GetInstallationsCommandInput - {@link GetInstallationsCommandInput}
 * @returns {@link GetInstallationsCommandOutput}
 * @see {@link GetInstallationsCommandInput} for command's `input` shape.
 * @see {@link GetInstallationsCommandOutput} for command's `response` shape.
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
export class GetInstallationsCommand extends $Command.classBuilder<GetInstallationsCommandInput, GetInstallationsCommandOutput, AppFrameworkClientResolvedConfig, ServiceInputTypes, ServiceOutputTypes>()
      .m(function (this: any, Command: any, cs: any, config: AppFrameworkClientResolvedConfig, o: any) {
          return [

  getSerdePlugin(config, this.serialize, this.deserialize),
      ];
  })
  .s("AppFramework", "GetInstallations", {

  })
  .n("AppFrameworkClient", "GetInstallationsCommand")
  .f(void 0, void 0)
  .ser(se_GetInstallationsCommand)
  .de(de_GetInstallationsCommand)
.build() {
/** @internal type navigation helper, not in runtime. */
declare protected static __types: {
  api: {
      input: GetInstallationsInput;
      output: GetInstallationsOutput;
  };
  sdk: {
      input: GetInstallationsCommandInput;
      output: GetInstallationsCommandOutput;
  };
};
}
