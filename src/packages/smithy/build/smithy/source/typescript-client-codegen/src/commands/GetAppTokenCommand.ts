// @ts-nocheck
// smithy-typescript generated code
import {
  AppFrameworkClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../AppFrameworkClient";
import {
  GetAppTokenInput,
  GetAppTokenOutput,
} from "../models/models_0";
import {
  de_GetAppTokenCommand,
  se_GetAppTokenCommand,
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
 * The input for {@link GetAppTokenCommand}.
 */
export interface GetAppTokenCommandInput extends GetAppTokenInput {}
/**
 * @public
 *
 * The output of {@link GetAppTokenCommand}.
 */
export interface GetAppTokenCommandOutput extends GetAppTokenOutput, __MetadataBearer {}

/**
 * @public
 *
 * @example
 * Use a bare-bones client and the command you need to make an API call.
 * ```javascript
 * import { AppFrameworkClient, GetAppTokenCommand } from "@aws/app-framework-for-github-apps-on-aws-client"; // ES Modules import
 * // const { AppFrameworkClient, GetAppTokenCommand } = require("@aws/app-framework-for-github-apps-on-aws-client"); // CommonJS import
 * const client = new AppFrameworkClient(config);
 * const input = { // GetAppTokenInput
 *   appId: Number("int"), // required
 * };
 * const command = new GetAppTokenCommand(input);
 * const response = await client.send(command);
 * // { // GetAppTokenOutput
 * //   appToken: "STRING_VALUE",
 * //   appId: Number("int"),
 * //   expirationTime: new Date("TIMESTAMP"),
 * // };
 *
 * ```
 *
 * @param GetAppTokenCommandInput - {@link GetAppTokenCommandInput}
 * @returns {@link GetAppTokenCommandOutput}
 * @see {@link GetAppTokenCommandInput} for command's `input` shape.
 * @see {@link GetAppTokenCommandOutput} for command's `response` shape.
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
export class GetAppTokenCommand extends $Command.classBuilder<GetAppTokenCommandInput, GetAppTokenCommandOutput, AppFrameworkClientResolvedConfig, ServiceInputTypes, ServiceOutputTypes>()
      .m(function (this: any, Command: any, cs: any, config: AppFrameworkClientResolvedConfig, o: any) {
          return [

  getSerdePlugin(config, this.serialize, this.deserialize),
      ];
  })
  .s("AppFramework", "GetAppToken", {

  })
  .n("AppFrameworkClient", "GetAppTokenCommand")
  .f(void 0, void 0)
  .ser(se_GetAppTokenCommand)
  .de(de_GetAppTokenCommand)
.build() {
/** @internal type navigation helper, not in runtime. */
declare protected static __types: {
  api: {
      input: GetAppTokenInput;
      output: GetAppTokenOutput;
  };
  sdk: {
      input: GetAppTokenCommandInput;
      output: GetAppTokenCommandOutput;
  };
};
}
