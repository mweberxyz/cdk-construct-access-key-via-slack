import { Construct } from "@aws-cdk/core";
import { IUser } from "@aws-cdk/aws-iam";
export default class AccessKeyViaSlack extends Construct {
    constructor(scope: Construct, id: string, props: {
        user: IUser;
        slackWebhookUrl: string;
    });
}
