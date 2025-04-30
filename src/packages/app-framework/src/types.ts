import { Octokit } from '@octokit/rest';
import { GetResponseDataTypeFromEndpointMethod } from '@octokit/types';

const octokit = new Octokit();

// Output response type from app/installations/${installationId}/access_tokens GitHub API
export type GetInstallationAccessTokenResponseType =
  GetResponseDataTypeFromEndpointMethod<
    typeof octokit.rest.apps.createInstallationAccessToken
  >;

// Output response of each installation in /app/installations GitHub API
export type AppInstallationsResponseType =
  GetResponseDataTypeFromEndpointMethod<
    typeof octokit.rest.apps.listInstallations
  >;

// Output response of each installation in /app GitHub API
export type AppAuthenticationResponseType =
  GetResponseDataTypeFromEndpointMethod<
    typeof octokit.rest.apps.getAuthenticated
  >;
