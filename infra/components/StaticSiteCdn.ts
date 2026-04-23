import * as fs from 'fs';
import * as path from 'path';
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { AppConfig } from '../config';
import { AcmCertificate } from './AcmCertificate';
import { createCrossAccountRoute53Provider } from './CrossAccountRoute53Provider';

interface StaticSiteCdnProps {
    appConfig: AppConfig;
    appName: string;
    siteRoot: string;
    siteKey: pulumi.Input<string>;
}

const CONTENT_TYPES: Record<string, string> = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.ico': 'image/x-icon',
    '.webp': 'image/webp',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
};

const ROOT_HTML_FILES = [
    'index.html',
    'blog-list.html',
    'faq.html',
    'feature-details.html',
    'get-started.html',
    'office-agent.html',
    'price.html',
    'product-brochure.html',
    'webinar.html',
];

const ASSET_DIRS = ['blogs', 'css'];

const EXPLICIT_FILES = ['js/common.js'];

function walkDir(dir: string, base: string, out: string[]): void {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            walkDir(full, base, out);
        } else if (entry.isFile()) {
            out.push(path.relative(base, full));
        }
    }
}

function collectAssetKeys(siteRoot: string): string[] {
    const keys: string[] = [];
    for (const name of ROOT_HTML_FILES) {
        if (fs.existsSync(path.join(siteRoot, name))) keys.push(name);
    }
    for (const dir of ASSET_DIRS) {
        const abs = path.join(siteRoot, dir);
        if (!fs.existsSync(abs)) continue;
        const found: string[] = [];
        walkDir(abs, siteRoot, found);
        keys.push(...found.map((p) => p.split(path.sep).join('/')));
    }
    for (const rel of EXPLICIT_FILES) {
        if (fs.existsSync(path.join(siteRoot, rel))) keys.push(rel);
    }
    return keys;
}

function cacheControlFor(key: string): string {
    return key.endsWith('.html') ? 'public, max-age=300' : 'public, max-age=3600';
}

function sanitizeResourceName(key: string): string {
    return key.replace(/[^A-Za-z0-9-]/g, '-');
}

const CLEAN_URL_FUNCTION_CODE = `function handler(event) {
    var request = event.request;
    var uri = request.uri;

    if (uri === '/') {
        request.uri = '/index.html';
        return request;
    }

    if (uri.endsWith('/')) {
        request.uri = uri + 'index.html';
        return request;
    }

    var lastSegment = uri.substring(uri.lastIndexOf('/') + 1);
    if (lastSegment.indexOf('.') === -1) {
        request.uri = uri + '.html';
    }

    return request;
}`;

export class StaticSiteCdn extends pulumi.ComponentResource {
    public readonly url: pulumi.Output<string>;
    public readonly distributionId: pulumi.Output<string>;
    public readonly bucketName: pulumi.Output<string>;

    constructor(name: string, props: StaticSiteCdnProps, opts?: pulumi.ComponentResourceOptions) {
        super('test-officeagent:component:StaticSiteCdn', name, {}, opts);

        const { appConfig, appName, siteRoot, siteKey } = props;
        const resourcePrefix = `${appConfig.env}-${appName}`;
        const s3OriginId = 's3-origin';

        const bucket = new aws.s3.Bucket(`${name}-bucket`, {
            bucket: `nai-${appName}-${appConfig.env}`,
            acl: 'private',
            forceDestroy: appConfig.env !== 'prod',
        }, { parent: this });

        this.bucketName = bucket.id;

        new aws.s3.BucketPublicAccessBlock(`${name}-pab`, {
            bucket: bucket.id,
            blockPublicAcls: true,
            blockPublicPolicy: true,
            ignorePublicAcls: true,
            restrictPublicBuckets: true,
        }, { parent: this });

        const originAccessControl = new aws.cloudfront.OriginAccessControl(`${name}-oac`, {
            name: `${resourcePrefix}-oac`,
            description: 'Managed by Pulumi',
            originAccessControlOriginType: 's3',
            signingBehavior: 'always',
            signingProtocol: 'sigv4',
        }, { parent: this });

        let acmCertificateArn: pulumi.Output<string> | undefined;
        if (!appConfig.skipDomainSetup && appConfig.domain) {
            const cert = new AcmCertificate(`${name}-acm`, {
                appConfig,
                appName,
            }, { parent: this });
            acmCertificateArn = cert.certificateArn;
        }

        const cleanUrlFunction = new aws.cloudfront.Function(`${name}-clean-url`, {
            name: `${resourcePrefix}-clean-url`,
            runtime: 'cloudfront-js-2.0',
            comment: 'Rewrite clean URLs to .html and directory index',
            publish: true,
            code: CLEAN_URL_FUNCTION_CODE,
        }, { parent: this });

        const htmlCachePolicy = new aws.cloudfront.CachePolicy(`${name}-html-policy`, {
            name: `${resourcePrefix}-html-cache`,
            comment: 'HTML pages — 5 minute TTL',
            defaultTtl: 300,
            maxTtl: 300,
            minTtl: 0,
            parametersInCacheKeyAndForwardedToOrigin: {
                cookiesConfig: { cookieBehavior: 'none' },
                headersConfig: { headerBehavior: 'none' },
                queryStringsConfig: { queryStringBehavior: 'none' },
                enableAcceptEncodingBrotli: true,
                enableAcceptEncodingGzip: true,
            },
        }, { parent: this });

        const distribution = new aws.cloudfront.Distribution(`${name}-dist`, {
            comment: `${resourcePrefix}-cdn`,
            enabled: true,
            isIpv6Enabled: true,
            httpVersion: 'http2and3',
            defaultRootObject: 'index.html',
            restrictions: {
                geoRestriction: { restrictionType: 'none' },
            },
            origins: [{
                originId: s3OriginId,
                domainName: bucket.bucketRegionalDomainName,
                originAccessControlId: originAccessControl.id,
            }],
            defaultCacheBehavior: {
                targetOriginId: s3OriginId,
                viewerProtocolPolicy: 'redirect-to-https',
                allowedMethods: ['GET', 'HEAD', 'OPTIONS'],
                cachedMethods: ['GET', 'HEAD', 'OPTIONS'],
                cachePolicyId: htmlCachePolicy.id,
                compress: true,
                functionAssociations: [{
                    eventType: 'viewer-request',
                    functionArn: cleanUrlFunction.arn,
                }],
            },
            customErrorResponses: [
                { errorCode: 403, responseCode: 404, responsePagePath: '/index.html', errorCachingMinTtl: 60 },
                { errorCode: 404, responseCode: 404, responsePagePath: '/index.html', errorCachingMinTtl: 60 },
            ],
            aliases: appConfig.skipDomainSetup ? undefined : [appConfig.domain],
            viewerCertificate: appConfig.skipDomainSetup ? {
                cloudfrontDefaultCertificate: true,
            } : {
                acmCertificateArn: acmCertificateArn,
                sslSupportMethod: 'sni-only',
                minimumProtocolVersion: 'TLSv1.2_2021',
            },
        }, { parent: this });

        this.distributionId = distribution.id;
        this.url = distribution.domainName;

        new aws.s3.BucketPolicy(`${name}-bucket-policy`, {
            bucket: bucket.id,
            policy: pulumi
                .all([bucket.arn, aws.getCallerIdentityOutput().accountId, distribution.id])
                .apply(([bucketArn, accountId, distId]) => JSON.stringify({
                    Version: '2012-10-17',
                    Statement: [{
                        Sid: 'AllowCloudFrontServicePrincipal',
                        Effect: 'Allow',
                        Principal: { Service: 'cloudfront.amazonaws.com' },
                        Action: 's3:GetObject',
                        Resource: `${bucketArn}/*`,
                        Condition: {
                            StringEquals: {
                                'AWS:SourceArn': `arn:aws:cloudfront::${accountId}:distribution/${distId}`,
                            },
                        },
                    }],
                })),
        }, { parent: this });

        if (!appConfig.skipDomainSetup && appConfig.domain) {
            const p1Provider = createCrossAccountRoute53Provider(`${name}-p1`, appConfig, this);

            const hostedZone = aws.route53.getZone({
                name: appConfig.hostedZone,
            }, { provider: p1Provider, parent: this });

            new aws.route53.Record(`${name}-alias-a`, {
                name: appConfig.domain,
                zoneId: hostedZone.then((z) => z.id),
                type: 'A',
                aliases: [{
                    name: distribution.domainName,
                    zoneId: distribution.hostedZoneId,
                    evaluateTargetHealth: false,
                }],
            }, { provider: p1Provider, parent: this });

            new aws.route53.Record(`${name}-alias-aaaa`, {
                name: appConfig.domain,
                zoneId: hostedZone.then((z) => z.id),
                type: 'AAAA',
                aliases: [{
                    name: distribution.domainName,
                    zoneId: distribution.hostedZoneId,
                    evaluateTargetHealth: false,
                }],
            }, { provider: p1Provider, parent: this });
        }

        if (!appConfig.skipAssetUpload) {
            const keys = collectAssetKeys(siteRoot);
            for (const key of keys) {
                const absPath = path.join(siteRoot, key);
                const ext = path.extname(key).toLowerCase();
                const isHtml = ext === '.html';
                const source: pulumi.Input<pulumi.asset.Asset> = isHtml
                    ? pulumi.all([siteKey, appConfig.chatbotDomain]).apply(
                          ([k, chatbotDomain]) =>
                              new pulumi.asset.StringAsset(
                                  fs.readFileSync(absPath, 'utf8')
                                      .replace(/__SITE_KEY__/g, k)
                                      .replace(/__CHATBOT_DOMAIN__/g, chatbotDomain),
                              ),
                      )
                    : new pulumi.asset.FileAsset(absPath);
                new aws.s3.BucketObject(`asset-${sanitizeResourceName(key)}`, {
                    bucket: bucket.id,
                    key,
                    source,
                    contentType: CONTENT_TYPES[ext] ?? 'application/octet-stream',
                    cacheControl: cacheControlFor(key),
                }, { parent: this });
            }
        }

        this.registerOutputs({
            url: this.url,
            distributionId: this.distributionId,
            bucketName: this.bucketName,
        });
    }
}
