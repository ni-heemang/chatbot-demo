import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { AppConfig } from '../config';
import { createCrossAccountRoute53Provider } from './CrossAccountRoute53Provider';

interface AcmCertificateProps {
    appConfig: AppConfig;
    appName: string;
}

export class AcmCertificate extends pulumi.ComponentResource {
    public readonly certificateArn: pulumi.Output<string>;

    constructor(name: string, props: AcmCertificateProps, opts?: pulumi.ComponentResourceOptions) {
        super('test-officeagent:component:AcmCertificate', name, {}, opts);

        const { appConfig } = props;

        const usEast1Provider = new aws.Provider(`${name}-us-east-1`, {
            region: 'us-east-1',
            defaultTags: { tags: appConfig.defaultTags },
        }, { parent: this });

        const cert = new aws.acm.Certificate(`${name}-cert`, {
            domainName: appConfig.domain,
            validationMethod: 'DNS',
        }, { provider: usEast1Provider, parent: this });

        const p1Provider = createCrossAccountRoute53Provider(`${name}-p1`, appConfig, this);

        const hostedZone = aws.route53.getZone({
            name: appConfig.hostedZone,
        }, { provider: p1Provider, parent: this });

        const certValidationDomain = cert.domainValidationOptions[0];

        const validationRecord = new aws.route53.Record(`${name}-val-record`, {
            name: certValidationDomain.resourceRecordName,
            zoneId: hostedZone.then((z) => z.id),
            type: certValidationDomain.resourceRecordType,
            records: [certValidationDomain.resourceRecordValue],
            ttl: 120,
        }, { provider: p1Provider, parent: this });

        const certValidation = new aws.acm.CertificateValidation(`${name}-val`, {
            certificateArn: cert.arn,
            validationRecordFqdns: [validationRecord.fqdn],
        }, {
            provider: usEast1Provider,
            parent: this,
            customTimeouts: { create: '10m' },
        });

        this.certificateArn = certValidation.certificateArn;

        this.registerOutputs({
            certificateArn: this.certificateArn,
        });
    }
}
