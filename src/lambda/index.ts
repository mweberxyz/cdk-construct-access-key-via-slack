import type {
  CloudFormationCustomResourceEvent as Event,
  CloudFormationCustomResourceHandler as Handler,
  CloudFormationCustomResourceSuccessResponse as SuccessResponse,
  CloudFormationCustomResourceFailedResponse as FailedResponse,
} from "aws-lambda";

import fetch from "node-fetch";
import type { AccessKeyViaSlackProperties } from "../types";

const { WEBHOOK_URL } = process.env;

if (!WEBHOOK_URL) {
  throw new Error("WEBHOOK_URL environment variable not defined,");
}

const postJson = async (url: string, body: unknown) => {
  const response = await fetch(url, {
    method: "post",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (response.status !== 200) {
    throw new Error(`Non-200 response: ${await response.text()}`);
  }
};

const eventHandlers = {
  Create: (properties: AccessKeyViaSlackProperties) => {
    return postJson(WEBHOOK_URL, {
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
  },
  Update: async () => {},
  Delete: async (properties: AccessKeyViaSlackProperties) => {
    return postJson(WEBHOOK_URL, {
      blocks: [
        {
          type: "section",
          text: {
            type: "plain_text",
            emoji: true,
            text: `Access key deleted for ${properties.userName}`,
          },
        },
        {
          type: "divider",
        },
      ],
    });
  },
};

export const handler: Handler = async (event: Event) => {
  const physicalResourceId = `${event.ResourceProperties.accessKeyId}-message`;

  try {
    const properties: AccessKeyViaSlackProperties = {
      accessKeyId: event.ResourceProperties.accessKeyId,
      accessKeySecret: event.ResourceProperties.accessKeySecret,
      userName: event.ResourceProperties.userName,
    };

    await eventHandlers[event.RequestType](properties);

    const successResponse: SuccessResponse = {
      Status: "SUCCESS",
      PhysicalResourceId: physicalResourceId,
      StackId: event.StackId,
      RequestId: event.RequestId,
      LogicalResourceId: event.LogicalResourceId,
    };

    await postJson(event.ResponseURL, successResponse);
  } catch (err) {
    const failedResponse: FailedResponse = {
      Status: "FAILED",
      StackId: event.StackId,
      RequestId: event.RequestId,
      LogicalResourceId: event.LogicalResourceId,
      PhysicalResourceId: physicalResourceId,
      Reason: err.toString().substring(0, 50),
    };

    await postJson(event.ResponseURL, failedResponse);

    throw err;
  }
};
