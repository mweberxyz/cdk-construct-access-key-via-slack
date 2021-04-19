import { Construct, CustomResource } from "@aws-cdk/core";
import { IUser, CfnAccessKey } from "@aws-cdk/aws-iam";
import * as lambda from "@aws-cdk/aws-lambda";
import * as path from "path";

import type { AccessKeyViaSlackProperties } from "./types";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const pkgVersion = require("../package.json").version;

export default class AccessKeyViaSlack extends Construct {
  constructor(scope: Construct, id: string, props: { user: IUser; slackWebhookUrl: string }) {
    super(scope, id);
    const fn = new lambda.SingletonFunction(this, "AccessKeyViaSlackFunction", {
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset(path.join(__dirname, "./lambda")),
      uuid: `access-key-via-slack-${pkgVersion}-${props.slackWebhookUrl}`,
      environment: {
        WEBHOOK_URL: props.slackWebhookUrl,
      },
    });

    const accessKey = new CfnAccessKey(this, `${id}AccessKey`, {
      userName: props.user.userName,
    });

    const properties: AccessKeyViaSlackProperties = {
      userName: props.user.userName,
      accessKeyId: accessKey.ref,
      accessKeySecret: accessKey.attrSecretAccessKey,
    };

    new CustomResource(this, `${id}Notification`, {
      serviceToken: fn.functionArn,
      properties,
    });
  }
}
