import * as path from 'path';
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { AppConfig } from './config';
import { StaticSiteCdn } from './components/StaticSiteCdn';

const config = new AppConfig();
const awsRegion = aws.config.region ?? 'ap-northeast-2';

const awsProvider = new aws.Provider('default', {
    region: awsRegion as aws.Region,
    defaultTags: { tags: config.defaultTags },
});

const siteRoot = path.resolve(__dirname, '..');

const site = new StaticSiteCdn(config.appName, {
    appConfig: config,
    appName: config.appName,
    siteRoot,
    siteKey: config.siteKey,
}, { provider: awsProvider });

export const url = site.url;
export const distributionId = site.distributionId;
export const bucketName = site.bucketName;
