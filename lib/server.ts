import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as cors from 'cors';
import * as tmp from 'tmp';
import * as request from 'request';
import * as NodeCache from 'node-cache';
import * as shortid from 'shortid';
import * as fs from 'fs';
import * as HttpStatus from 'http-status-codes';

import * as catalog from 'core/catalog';
import * as deploy from 'core/deploy';
import {zipFolder} from 'core/utils';
import * as Sentry from 'raven';
import { ApplicationDescriptor, DeploymentDescriptor } from 'core/catalog/types';

tmp.setGracefulCleanup();
const app = express();
const router = express.Router();

const sentryEnabled = !!process.env.SENTRY_DSN;

console.log('Sentry Enabled:', sentryEnabled);

const zipCache = new NodeCache({'checkperiod': 60});

if (sentryEnabled) {
    // Must configure Sentry before doing anything else with it
    Sentry.config(process.env.SENTRY_DSN).install();
    // The request handler must be the first middleware on the app
    app.use(Sentry.requestHandler());
}

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({'extended': true}));

app.use(cors());

router.get('/', (req, res) => {
    const url = 'https://forge.api.openshift.io/creator/openapi';
    res.redirect(`https://editor.swagger.io/?url=${url}`);
});

router.use('/health', (req, res) => {
    res.status(HttpStatus.OK).send('OK');
});

router.use('/openapi', express.static('./openapi.yaml'));

router.get('/capabilities', (req, res, next) => {
    const caps = catalog.listCapabilityInfos();
    res.status(HttpStatus.OK).send(caps);
});

router.get('/generators', (req, res) => {
    const gens = catalog.listGeneratorInfos();
    res.status(HttpStatus.OK).send(gens);
});

router.get('/enums', (req, res) => {
    res.status(HttpStatus.OK).send(catalog.listEnums());
});

router.get('/enums/:id', (req, res) => {
        const id = req.params.id;
        const enumdef = catalog.listEnums()[id] || [];
        res.status(HttpStatus.OK).send(enumdef);
});

router.get('/download', (req, res, next) => {
    // Make sure we have all the required inputs
    if (!req.query.id) {
        sendReply(res, HttpStatus.BAD_REQUEST, 'Missing download ID');
        return;
    }
    const id = req.query.id;
    zipCache.get(id, (err, data?: { name, file }) => {
        if (err) {
            sendReply(res, HttpStatus.INTERNAL_SERVER_ERROR, err);
            return;
        }
        if (!data) {
            sendReply(res, HttpStatus.NOT_FOUND, 'Not found');
        } else {
            res.writeHead(HttpStatus.OK, {
                'Content-Type': 'application/zip',
                'Content-disposition': `attachment; filename=${data.name}`
            });
            fs.createReadStream(data.file).pipe(res);
        }
    });
});

zipCache.on('del', (key, value) => {
    value.cleanTempDir();
    console.info(`Cleaning zip cache key: ${key}`);
});

interface ZipRequest {
    project: ApplicationDescriptor;  // All applications that are part of the deployment
}

router.post('/zip', (req, res, next) => {
    // Make sure we have all the required inputs
    if (!validateGenerationRequest(req, res)) {
        return;
    }
    // Create temp dir
    tmp.dir({'unsafeCleanup': true}, async (err, tempDir, cleanTempDir) => {
        // Generate contents
        const projectDir = `${tempDir}/project`;
        fs.mkdirSync(projectDir);
        const projectZip = `${tempDir}/project.zip`;
        const out = fs.createWriteStream(projectZip);
        try {
            const zreq = req.body as ZipRequest;
            const deployment: DeploymentDescriptor = {
                'applications': [ zreq.project ]
            };
            await deploy.applyDeployment(projectDir, deployment);
            await zipFolder(out, projectDir, zreq.project.application);
            const id = shortid.generate();
            zipCache.set(id, { 'file': projectZip, 'name': `${zreq.project.application}.zip`, cleanTempDir }, 600);
            res.status(HttpStatus.OK).send({ id });
        } catch (ex) {
            // TODO: Call catch(next)
            sendReply(res, HttpStatus.INTERNAL_SERVER_ERROR, ex);
        }
    });
});

interface LaunchRequest {
    project: ApplicationDescriptor;  // All applications that are part of the deployment
    projectName: string;
    gitRepository: string;
    gitOrganization?: string;
    clusterId?: string;
}

router.post('/launch', (req, res, next) => {
    // Make sure we're autenticated
    if (!req.get('Authorization')) {
        sendReply(res, HttpStatus.UNAUTHORIZED, 'Unauthorized');
        return;
    }
    // And have all the required inputs
    if (!validateGenerationRequest(req, res)) {
        return;
    }
    // Create temp dir
    tmp.dir({'unsafeCleanup': true}, async (err, tempDir, cleanTempDir) => {
        // Generate contents
        const projectDir = `${tempDir}/project`;
        fs.mkdirSync(projectDir);
        const projectZip = `${tempDir}/project.zip`;
        const out = fs.createWriteStream(projectZip);
        try {
            const lreq = req.body as LaunchRequest;
            const deployment: DeploymentDescriptor = {
                'applications': [ lreq.project ]
            };
            await deploy.applyDeployment(projectDir, deployment);
            zipFolder(out, projectDir, lreq.project.application);
            out.on('finish', () => {
                // Prepare to post
                const ins = fs.createReadStream(projectZip);
                const formData = {
                    'projectName': lreq.projectName,
                    'gitRepository': lreq.gitRepository,
                    'file': ins
                };
                if (lreq.gitOrganization) {
                    formData['gitOrganization'] = lreq.gitOrganization;
                }
                const auth = {
                    'bearer': req.get('Authorization').slice(7)
                };
                const headers = {};
                if (lreq.clusterId) {
                    headers['X-OpenShift-Cluster'] = lreq.clusterId;
                }
                const backendUrl = process.env.LAUNCHER_BACKEND_URL || 'http://localhost:8080/api';
                const options = {
                    'url': backendUrl + '/launcher/upload',
                    formData,
                    auth,
                    headers
                };
                request.post(options, (err2, res2, body) => {
                    console.info(`Pushed project "${lreq.project.application}" to ${backendUrl} - ${res2.statusCode}`);
                    let json = null;
                    try {
                        json = JSON.parse(body);
                    } catch (e) { /* ignore parse errors */
                    }
                    if (!err2 && res2.statusCode === HttpStatus.OK) {
                        sendReply(res, HttpStatus.OK, json || body);
                    } else {
                        sendReply(res, res2.statusCode, json || err2 || res2.statusMessage);
                    }
                    cleanTempDir();
                });
            });
        } catch (ex) {
            // TODO: Call next
            sendReply(res, HttpStatus.INTERNAL_SERVER_ERROR, ex);
        }
    });
});

app.use('/', router);
app.use('/creator', router);

if (sentryEnabled) {
    // The error handler must be before any other error middleware
    app.use(Sentry.errorHandler());
}

// Default Error Handler
app.use((ex, req, res, next) => {
    // handle error
    if (ex) {
        sendReply(res, HttpStatus.INTERNAL_SERVER_ERROR, ex, res.sentry);
    }
});

const server = app.listen(parseInt(process.argv[2] || '8080', 10), onListening);

function validateGenerationRequest(req, res) {
    // Make sure we have all the required inputs
    if (!req.body.project) {
        sendReply(res, HttpStatus.BAD_REQUEST, 'Malformed request, missing project');
        return false;
    }
    const appDesc = req.body.project as ApplicationDescriptor;
    if (!appDesc.application) {
        sendReply(res, HttpStatus.BAD_REQUEST, 'Missing application name');
        return false;
    }
    if (!appDesc.parts || !Array.isArray(appDesc.parts) || appDesc.parts.length === 0) {
        sendReply(res, HttpStatus.BAD_REQUEST, 'Missing application parts');
    }
    for (const part of appDesc.parts) {
        if (!part.capabilities || !Array.isArray(part.capabilities) || part.capabilities.length === 0) {
            sendReply(res, HttpStatus.BAD_REQUEST, 'Missing application part capabilities');
            return false;
        }
    }
    return true;
}

function onListening(): void {
    const address = server.address();
    const bind = (typeof address === 'string') ? `pipe ${address}` : `port ${address.port}`;
    console.log(`Listening on ${bind}`);
}

function sendReply(res, statusCode, msg, sentryId?) {
    const obj = {};
    if (msg instanceof Error) {
        obj['message'] = msg.toString();
        if (msg.stack) {
            obj['stack'] = msg.stack.toString();
        }
    } else if (Array.isArray(msg)) {
        obj['message'] = msg;
    } else if (typeof msg === 'object') {
        Object.assign(obj, msg);
    } else if (msg) {
        obj['message'] = msg.toString();
    }
    obj['statusCode'] = statusCode;
    if (sentryId) {
        obj['sentryId'] = sentryId;
    }
    res.status(statusCode).send(obj);
    if (statusCode !== HttpStatus.OK) {
        console.error('SERVER ERROR', statusCode, msg);
    }
}
