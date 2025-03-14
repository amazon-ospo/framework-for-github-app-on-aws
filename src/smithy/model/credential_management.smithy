namespace genet.api

resource CredentialManagementService{
    operations: [GetInstallationToken, GetAppToken]
}

@readonly
@http(method: "GET", uri: "/tokens/installation")
operation GetInstallationToken {
    input: GetInstallationTokenInput,
    output: GetInstallationTokenOutput
    errors:[ServerSideError, AccessDeniedError, RateLimitError, GatewayTimeoutError]
}

structure GetInstallationTokenOutput {
    installationToken: String
}

@readonly
@http(method: "GET", uri: "/tokens/app")
operation GetAppToken {
    input: GetAppTokenInput,
    output: GetAppTokenOutput
    errors:[ServerSideError, AccessDeniedError, GatewayTimeoutError]
}

structure GetInstallationTokenInput {
    @required
    @httpQuery("appId")
    appId: String

    @required
    @httpQuery("nodeId")
    nodeId: String
}

structure GetAppTokenInput {
    @required
    @httpQuery("appId")
    appId: String
}

structure GetAppTokenOutput {
    appToken: String
}

@httpError(500)
@error("server")
structure ServerSideError {
    message: String,
}

// Error that can occur when unable to access AWS resources
@httpError(403)
@error("client")
structure AccessDeniedError {
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