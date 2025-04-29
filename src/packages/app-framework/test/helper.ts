import { APIGatewayProxyEventV2 } from 'aws-lambda';

// Helper method used to generate default APIGatewayProxyEventV2 to use as input for handlerImpl testing
export const apiGatewayEventHelper = ({
  path,
  body,
  version = 2.0,
}: {
  path: string;
  body?: string;
  version?: number;
}): APIGatewayProxyEventV2 => {
  return {
    version: `${version.toFixed(1)}`,
    routeKey: '$default',
    rawPath: path,
    rawQueryString: '',
    headers: {},
    requestContext: {
      accountId: '1234567',
      apiId: 'some-id',
      domainName: 'something.lambda-url.us-west-2.on.aws',
      domainPrefix: 'something',
      http: {
        method: 'POST',
        path: path,
        protocol: 'HTTP/1.1',
        sourceIp: 'some-ip',
        userAgent: 'some-agent',
      },
      requestId: 'some-id',
      routeKey: '$default',
      stage: '$default',
      time: 'some-time',
      timeEpoch: 1234567,
    },
    body: body,
    isBase64Encoded: false,
  };
};
