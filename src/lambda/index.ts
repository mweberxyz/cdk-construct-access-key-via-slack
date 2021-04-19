import type {
  CloudFormationCustomResourceEvent as Event,
  CloudFormationCustomResourceHandler as Handler,
  CloudFormationCustomResourceSuccessResponse as SuccessResponse,
  CloudFormationCustomResourceFailedResponse as FailedResponse,
} from "aws-lambda";

import fetch from "node-fetch";
import type { AccessKeyViaSlackProperties } from "../types";

export const handler: Handler = async (event: Event) => {
  const physicalResourceId = `${event.ResourceProperties.accessKeyId}-message`;

  const respondToCloudformation = async (body: unknown) => {
    const response = await fetch(event.ResponseURL, {
      method: "put",
      headers: {
        "content-type": "",
      },
      body: JSON.stringify(body),
    });

    if (response.status !== 200) {
      throw new Error(`Non-200 response from cloudformation: ${await response.text()}`);
    }
  };

  try {
    const { WEBHOOK_URL } = process.env;

    if (!WEBHOOK_URL) {
      throw new Error("WEBHOOK_URL environment variable not defined,");
    }

    const sendSlackWebhook = async (body: unknown) => {
      const response = await fetch(WEBHOOK_URL, {
        method: "post",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (response.status !== 200) {
        throw new Error(`Non-200 response from slack: ${await response.text()}`);
      }
    };

    const properties: AccessKeyViaSlackProperties = {
      accessKeyId: event.ResourceProperties.accessKeyId,
      accessKeySecret: event.ResourceProperties.accessKeySecret,
      userName: event.ResourceProperties.userName,
    };

    if (event.RequestType === "Create") {
      await sendSlackWebhook({
        blocks: [
          {
            type: "section",
            text: {
              type: "plain_text",
              emoji: true,
              text: `Access key created for ${properties.userName}`,
            },
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `Access Key ID: \`${properties.accessKeyId}\``,
            },
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `Access Key Secret: \`${properties.accessKeySecret}\``,
            },
          },
          {
            type: "divider",
          },
        ],
      });
    } else if (event.RequestType === "Delete") {
      await sendSlackWebhook({
        blocks: [
          {
            type: "section",
            text: {
              type: "plain_text",
              emoji: true,
              text: `Access key ${properties.accessKeyId} deleted for ${properties.userName}`,
            },
          },
          {
            type: "divider",
          },
        ],
      });
    }

    const successResponse: SuccessResponse = {
      Status: "SUCCESS",
      PhysicalResourceId: physicalResourceId,
      StackId: event.StackId,
      RequestId: event.RequestId,
      LogicalResourceId: event.LogicalResourceId,
    };

    await respondToCloudformation(successResponse);
  } catch (err) {
    console.log(event.ResponseURL);

    const failedResponse: FailedResponse = {
      Status: "FAILED",
      StackId: event.StackId,
      RequestId: event.RequestId,
      LogicalResourceId: event.LogicalResourceId,
      PhysicalResourceId: physicalResourceId,
      Reason: err.toString(),
    };

    await respondToCloudformation(failedResponse);

    throw err;
  }
};
