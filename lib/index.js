"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@aws-cdk/core");
const aws_iam_1 = require("@aws-cdk/aws-iam");
const lambda = __importStar(require("@aws-cdk/aws-lambda"));
const path = __importStar(require("path"));
const crypto = __importStar(require("crypto"));
// eslint-disable-next-line @typescript-eslint/no-var-requires
const pkgVersion = require("../package.json").version;
class AccessKeyViaSlack extends core_1.Construct {
    constructor(scope, id, props) {
        super(scope, id);
        const singletonPostfix = crypto
            .createHash("sha256")
            .update(props.slackWebhookUrl)
            .update(pkgVersion)
            .digest("hex")
            .substring(0, 16);
        const fn = new lambda.SingletonFunction(this, "AccessKeyViaSlackFunction", {
            runtime: lambda.Runtime.NODEJS_14_X,
            handler: "index.handler",
            code: lambda.Code.fromAsset(path.join(__dirname, "./lambda")),
            uuid: `Singleton${singletonPostfix}`,
            environment: {
                WEBHOOK_URL: props.slackWebhookUrl,
            },
        });
        const accessKey = new aws_iam_1.CfnAccessKey(this, "AccessKey", {
            userName: props.user.userName,
        });
        const properties = {
            userName: props.user.userName,
            accessKeyId: accessKey.ref,
            accessKeySecret: accessKey.attrSecretAccessKey,
        };
        new core_1.CustomResource(this, "Notification", {
            serviceToken: fn.functionArn,
            properties,
        });
    }
}
exports.default = AccessKeyViaSlack;
