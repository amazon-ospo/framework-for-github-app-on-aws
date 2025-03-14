$version: "2.0"

namespace genet.api

use aws.auth#sigv4
use aws.protocols#restJson1
use smithy.framework#ValidationException

@title("Genet Service")
@auth([sigv4])
@sigv4(name: "Genet")
@restJson1
service GenetService {
    version: "2024-08-23"
    resources: [
        CredentialManagementService
    ]
    errors: [
        ValidationException,
        AccessDeniedError,
        GatewayTimeoutError
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