import { App } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { Genet } from '../src/main';

test('Snapshot', () => {
  const app = new App();
  const stack = new Genet(app, 'test', {});

  const template = Template.fromStack(stack);
  expect(template.toJSON()).toMatchSnapshot();
});
