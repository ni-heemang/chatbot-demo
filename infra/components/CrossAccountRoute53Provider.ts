import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { AppConfig } from '../config';

export function createCrossAccountRoute53Provider(
    name: string,
    config: AppConfig,
    baseProvider?: pulumi.Resource,
): aws.Provider {
    return new aws.Provider(name, {
        region: config.region as aws.Region,
        assumeRoles: [{
            roleArn: config.p1CrossAccountRoleArn,
            sessionName: `PulumiCrossAccountDNS-${config.env}`,
            externalId: 'office-agent-cross-account',
        }],
    }, { parent: baseProvider });
}
