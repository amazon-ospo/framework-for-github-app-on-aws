$version: "2.0"
namespace framework.api

resource CredentialManagementService{
    operations: [GetInstallationToken, GetAppToken, RefreshCachedData, GetInstallationData]
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

@http(method: "POST", uri: "/installations/refresh")
operation RefreshCachedData {
    input: RefreshCachedDataInput,
    output: RefreshCachedDataOutput,
    errors: [ServerSideError, ClientSideError]
}

@http(method: "POST", uri: "/installations/info")
operation GetInstallationData {
    input: GetInstallationDataInput,
    output: GetInstallationDataOutput,
    errors: [ServerSideError, ClientSideError]
}

list RepositoryIds {
    member: Integer
}

list RepositoryNames {
    member: String
}

map Permissions {
    key: String
    value: String
}

structure ScopeDown {
    repositoryIds: RepositoryIds,
    repositoryNames: RepositoryNames,
    permissions: Permissions,
}

structure GetInstallationTokenInput {
    @range(min: 1)
    @required
    appId: Integer

    @length(min: 1, max:256)
    @required
    nodeId: String
    scopeDown: ScopeDown
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

structure RefreshCachedDataInput {}

structure RefreshCachedDataOutput {
    message: String
    @timestampFormat("date-time")
    refreshedDate: Timestamp
}

structure GetInstallationDataInput {
    @length(min: 1, max:256)
    @required
    nodeId: String
}

structure InstallationData {
    nodeId: String
    appId: Integer
    installationId: Integer
}

list InstallationDataList {
    member: InstallationData
}
structure GetInstallationDataOutput {
    installations: InstallationDataList
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