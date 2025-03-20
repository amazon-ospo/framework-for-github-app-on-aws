import { App } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { GenetFrameworkTestStack } from '../src/main';

test('Snapshot', () => {
  const app = new App();
  const stack = new GenetFrameworkTestStack(
    app,
    'genet-framework-test-stack',
    {},
  );

  const template = Template.fromStack(stack);
  expect(template.toJSON()).toMatchSnapshot();
});
