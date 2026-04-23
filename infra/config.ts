import * as pulumi from '@pulumi/pulumi';

export class AppConfig {
    public readonly appName: string;
    public readonly env: string;
    public readonly region: string;
    public readonly hostedZone: string;
    public readonly domain: string;
    public readonly p1AccountId: string;
    public readonly skipDomainSetup: boolean;
    public readonly skipAssetUpload: boolean;
    public readonly siteKey: string;

    constructor() {
        const config = new pulumi.Config('app');
        const awsConfig = new pulumi.Config('aws');

        this.appName = config.require('appName');
        this.env = config.require('env');
        this.hostedZone = config.get('hostedZone') ?? '';
        this.domain = config.get('domain') ?? '';
        this.p1AccountId = config.require('p1AccountId');
        this.region = awsConfig.require('region');
        this.skipDomainSetup = config.getBoolean('skipDomainSetup') ?? false;
        this.skipAssetUpload = config.getBoolean('skipAssetUpload') ?? false;
        this.siteKey = config.get('siteKey') ?? '';
    }

    public get p1CrossAccountRoleArn(): string {
        return `arn:aws:iam::${this.p1AccountId}:role/OfficeAgentCrossAccountRole`;
    }

    public get defaultTags(): Record<string, string> {
        return {
            Component: this.appName,
            Environment: this.env,
            Name: `${this.appName}-${this.env}`,
            Service: 'officeagent',
        };
    }
}
