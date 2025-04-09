$version: "2.0"

namespace framework.api

use aws.auth#sigv4
use aws.protocols#restJson1

@title("Framework for GitHub Apps on AWS")
@auth([sigv4])
@sigv4(name: "execute-api")
@restJson1
service AppFramework {
    version: "2024-08-23"
    resources: [
        CredentialManagementService
    ]
    errors: [
        AccessDeniedError,
        GatewayTimeoutError,
        ServiceUnavailableError
    ]
}

// Error that can occur when unable to access AWS resources
@error("client")
@httpError(403)
structure AccessDeniedError {
    message: String,
}

// Error that can occur when unable to access AWS resources
@httpError(504)
@error("server")
structure GatewayTimeoutError {
    message: String,
}

// Error that can occur when AWS service is unavailable
@httpError(503)
@error("server")
structure ServiceUnavailableError {
    message: String,
}

// Error that can occur when not authorized to access AWS resources
@httpError(401)
@error("client")
structure NotAuthorizedError {
    message: String,
}