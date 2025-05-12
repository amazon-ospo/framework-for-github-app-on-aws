$version: "2.0"

namespace framework.api

use aws.auth#sigv4
use aws.protocols#restJson1
use smithy.framework#ValidationException

@title("Framework for GitHub Apps on AWS")
@auth([sigv4])
@sigv4(name: "lambda")
@restJson1
service AppFramework {
    version: "2024-08-23"
    resources: [
        CredentialManagementService
    ]
    errors: [
        ValidationException
    ]
}
