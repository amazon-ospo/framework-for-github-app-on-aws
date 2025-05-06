$version: "2.0"
namespace framework.api

resource CredentialManagementService{
    operations: [GetInstallationToken, GetAppToken]
}

// Placeholder API endpoints
@http(method: "POST", uri: "/tokens/installation")
operation GetInstallationToken {
    input: GetInstallationTokenInput,
    output: GetInstallationTokenOutput
    errors:[ServerSideError, ClientSideError]
}

// Placeholder API endpoints
@http(method: "POST", uri: "/tokens/app")
operation GetAppToken {
    input: GetAppTokenInput,
    output: GetAppTokenOutput
    errors:[ServerSideError, ClientSideError]
}

structure GetInstallationTokenInput {
    @range(min: 1)
    @required
    appId: Integer

    @length(min: 1, max:256)
    @required
    nodeId: String
}

structure GetInstallationTokenOutput {
    installationToken: String
    nodeId: String
    appId: Integer
    @timestampFormat("date-time")
    expirationTime: Timestamp
}

structure GetAppTokenInput {
    @range(min: 1)
    @required
    appId: Integer
}

structure GetAppTokenOutput {
    appToken: String
    appId: Integer
    @timestampFormat("date-time")
    expirationTime: Timestamp
}

@httpError(500)
@error("server")
structure ServerSideError {
    @default("Internal Server Error")
    message: String,
}

@httpError(400)
@error("client")
structure ClientSideError {
    message: String,
}