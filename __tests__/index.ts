import * as cdk from "@aws-cdk/core";
import { SynthUtils } from "@aws-cdk/assert";
import { User, CfnAccessKey } from "@aws-cdk/aws-iam";
import { CfnFunction } from "@aws-cdk/aws-lambda";
import flatten from "lodash/flatten";

import AccessKeyViaSlack from "../src/index";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getChildrenOfType = (stack: cdk.Stack, type: any) => {
  const children = stack.node
    .findAll()
    .map((construct) => construct.node.children.filter((child) => child instanceof type));

  return flatten(children);
};

test("it creates the correct resources", () => {
  const app = new cdk.App();
  const stack = new cdk.Stack(app, "Stack");
  const slackWebhookUrl = "url";

  const user1 = new User(stack, "UserOne");
  const user2 = new User(stack, "UserTwo");

  new AccessKeyViaSlack(stack, "UserOneAccessKey", { user: user1, slackWebhookUrl });
  new AccessKeyViaSlack(stack, "UserTwoAccessKey", { user: user2, slackWebhookUrl });

  const functions = getChildrenOfType(stack, CfnFunction);
  const accessKeys = getChildrenOfType(stack, CfnAccessKey);

  expect(functions).toHaveLength(1);
  expect(accessKeys).toHaveLength(2);
});

test("it creates singleton lambdas", () => {
  const app = new cdk.App();
  const stack = new cdk.Stack(app, "Stack");
  const slackWebhookUrl = "url";
  const slackWebhookUrl2 = "other-url";

  const user1 = new User(stack, "UserOne");
  const user2 = new User(stack, "UserTwo");
  const user3 = new User(stack, "UserThree");
  const user4 = new User(stack, "UserFour");

  new AccessKeyViaSlack(stack, "UserOneAccessKey", { user: user1, slackWebhookUrl });
  new AccessKeyViaSlack(stack, "UserTwoAccessKey", { user: user2, slackWebhookUrl });
  new AccessKeyViaSlack(stack, "UserThreeAccessKey", {
    user: user3,
    slackWebhookUrl: slackWebhookUrl2,
  });
  new AccessKeyViaSlack(stack, "UserFourAccessKey", {
    user: user4,
    slackWebhookUrl: slackWebhookUrl2,
  });

  const functions = getChildrenOfType(stack, CfnFunction);
  const accessKeys = getChildrenOfType(stack, CfnAccessKey);

  expect(functions).toHaveLength(2);
  expect(accessKeys).toHaveLength(4);
});

it("passes snapshot tests", () => {
  const app = new cdk.App();
  const stack = new cdk.Stack(app, "Stack");
  const slackWebhookUrl = "url";
  const user1 = new User(stack, "UserOne");
  new AccessKeyViaSlack(stack, "UserOneAccessKey", { user: user1, slackWebhookUrl });

  expect(SynthUtils.toCloudFormation(stack)).toMatchSnapshot();
});
