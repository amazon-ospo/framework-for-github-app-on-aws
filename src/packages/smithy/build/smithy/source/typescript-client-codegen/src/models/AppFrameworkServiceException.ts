// @ts-nocheck
// smithy-typescript generated code
import {
  ServiceException as __ServiceException,
  ServiceExceptionOptions as __ServiceExceptionOptions,
} from "@smithy/smithy-client";

export type { __ServiceExceptionOptions }

export { __ServiceException }

/**
 * @public
 *
 * Base exception class for all service exceptions from AppFramework service.
 */
export class AppFrameworkServiceException extends __ServiceException {
  /**
   * @internal
   */
  constructor(options: __ServiceExceptionOptions) {
    super(options);
    Object.setPrototypeOf(this, AppFrameworkServiceException.prototype);
  }
}
