import { name, version } from '../../../package.json';

export enum EnvironmentVariables {
  APP_TABLE_NAME = 'APP_TABLE_NAME',
  INSTALLATION_TABLE_NAME = 'INSTALLATION_TABLE_NAME',
}

export const USER_AGENT = `${name}/${version}`;
