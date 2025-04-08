namespace framework.api

resource CredentialManagementService{
    operations: [GetInstallationToken, GetAppToken]
}

// Placeholder API endpoints
@http(method: "POST", uri: "/example.com")
operation GetInstallationToken {
    input: GetInstallationTokenInput,
    output: GetInstallationTokenOutput
    errors:[ServerSideError, ClientSideError, AccessDeniedError, RateLimitError, GatewayTimeoutError, ServiceUnavailableError]
}

// Placeholder API endpoints
@http(method: "POST", uri: "/example.net")
operation GetAppToken {
    input: GetAppTokenInput,
    output: GetAppTokenOutput
    errors:[ServerSideError, ClientSideError, AccessDeniedError, GatewayTimeoutError, ServiceUnavailableError]
}

structure GetInstallationTokenInput {
    @required
    appId: Integer

    @required
    nodeId: String
}

structure GetInstallationTokenOutput {
    installationToken: String
    nodeId: String
    appId: Integer
}

structure GetAppTokenInput {
    @required
    appId: Integer
}

structure GetAppTokenOutput {
    appToken: String
    appId: Integer
}

@httpError(500)
@error("server")
structure ServerSideError {
    message: String,
}

@httpError(400)
@error("client")
structure ClientSideError {
    message: String,
}

// Error that can occur when unable to access AWS resources
@httpError(403)
@error("client")
structure AccessDeniedError {
    message: String,
}

// Error that can occur when not authorized to access AWS resources
@httpError(401)
@error("client")
structure NotAuthorizedError {
    message: String,
}

@httpError(429)
@error("client")
structure RateLimitError {
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