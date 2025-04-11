// Output response type from app/installations/${installationId}/access_tokens GitHub API
export type InstallationAccessTokenResponse = {
  token: string;
  expires_at: string;
  permissions: JSON;
  repository_selection: string;
};

// Output response of each installation in /app/installations GitHub API
export type AppInstallationType = {
  id: number;
  account: {
    node_id: string;
  };
  app_id: number;
};
