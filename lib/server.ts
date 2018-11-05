
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
import { resources } from 'core/resources';
import { zipFolder } from 'core/utils';

tmp.setGracefulCleanup();
const app = express();

const zipCache = new NodeCache({'checkperiod': 60});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({'extended': true}));

app.use(cors());

app.get('/', (req, res) => {
    const url = req.protocol + '://' + req.get('host') + req.originalUrl + 'openapi';
    res.redirect(`${req.protocol}://editor.swagger.io/?url=${url}`);
});

app.use('/openapi', express.static('./openapi.yaml'));

app.get('/capabilities', (req, res) => {
    catalog.listCapabilityInfos()
        .then(caps => res.status(HttpStatus.OK).send(caps))
        .catch(err => res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(result(HttpStatus.INTERNAL_SERVER_ERROR, err)));
});

app.get('/generators', (req, res) => {
    catalog.listGeneratorInfos()
        .then(caps => res.status(HttpStatus.OK).send(caps))
        .catch(err => res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(result(HttpStatus.INTERNAL_SERVER_ERROR, err)));
});

app.get('/runtimes', (req, res) => {
    catalog.listRuntimes()
        .then(list => res.status(HttpStatus.OK).send(list))
        .catch(err => res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(result(HttpStatus.INTERNAL_SERVER_ERROR, err)));
});

app.get('/download', (req, res) => {
    // Make sure we have all the required inputs
    if (!req.query.id) {
        res.status(HttpStatus.BAD_REQUEST).send(result(HttpStatus.BAD_REQUEST, new Error('Missing download ID')));
        return;
    }
    const id = req.query.id;
    zipCache.get(id, (err, data?: { name, file }) => {
        if (err) {
            res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(result(HttpStatus.INTERNAL_SERVER_ERROR, err));
            return;
        }
        if (!data) {
            res.status(HttpStatus.NOT_FOUND).send(result(HttpStatus.NOT_FOUND, new Error('Not found')));
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

app.post('/zip', (req, res) => {
    // Make sure we have all the required inputs
    if (!req.body.name) {
        res.status(HttpStatus.BAD_REQUEST).send(result(HttpStatus.BAD_REQUEST, new Error('Missing application name')));
        return;
    }
    if (!req.body.runtime) {
        res.status(HttpStatus.BAD_REQUEST).send(result(HttpStatus.BAD_REQUEST, new Error('Missing application runtime')));
        return;
    }
    if (!req.body.capabilities) {
        res.status(HttpStatus.BAD_REQUEST).send(result(HttpStatus.BAD_REQUEST, new Error('Missing application capabilities')));
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
            await deploy.apply(resources({}), projectDir, req.body.name, req.body.runtime, req.body.capabilities);
            await zipFolder(out, projectDir, req.body.name);
            const id = shortid.generate();
            zipCache.set(id, { 'file': projectZip, 'name': `${req.body.name}.zip`, cleanTempDir }, 600);
            res.status(HttpStatus.OK).send({ id });
        } catch (ex) {
            res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(result(HttpStatus.INTERNAL_SERVER_ERROR, ex));
        }
    });
});

app.post('/launch', (req, res) => {
    // Make sure we're autenticated
    if (!req.get('Authorization')) {
        res.status(401).send(result(HttpStatus.UNAUTHORIZED, 'Unauthorized'));
        return;
    }
    // And have all the required inputs
    if (!req.body.name) {
        res.status(HttpStatus.BAD_REQUEST).send(result(HttpStatus.BAD_REQUEST, new Error('Missing application name')));
        return;
    }
    if (!req.body.runtime) {
        res.status(HttpStatus.BAD_REQUEST).send(result(HttpStatus.BAD_REQUEST, new Error('Missing application runtime')));
        return;
    }
    if (!req.body.capabilities) {
        res.status(HttpStatus.BAD_REQUEST).send(result(HttpStatus.BAD_REQUEST, new Error('Missing application capabilities')));
        return;
    }
    if (!req.body.projectName) {
        res.status(HttpStatus.BAD_REQUEST).send(result(HttpStatus.BAD_REQUEST, new Error('Missing OpenShift project name')));
        return;
    }
    if (!req.body.gitRepository) {
        res.status(HttpStatus.BAD_REQUEST).send(result(HttpStatus.BAD_REQUEST, new Error('Missing Git repository name')));
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
            await deploy.apply(resources({}), projectDir, req.body.name, req.body.runtime, req.body.capabilities);
            zipFolder(out, projectDir, req.body.name);
            out.on('finish', () => {
                // Prepare to post
                const ins = fs.createReadStream(projectZip);
                const formData = {
                    'projectName': req.body.projectName,
                    'gitRepository': req.body.gitRepository,
                    'file': ins
                };
                if (req.body.gitOrganization) {
                    formData['gitOrganization'] = req.body.gitOrganization;
                }
                const auth = {
                    'bearer': req.get('Authorization').slice(7)
                };
                const headers = {};
                if (req.body.clusterId) {
                    headers['X-OpenShift-Cluster'] = req.body.clusterId;
                }
                const backendUrl = process.env.LAUNCHER_BACKEND_URL || 'http://localhost:8080/api';
                const options = {
                    'url': backendUrl + '/launcher/upload',
                    formData,
                    auth,
                    headers
                };
                request.post(options, (err2, res2, body) => {
                    console.info(`Pushed project "${req.body.name}" to ${backendUrl} - ${res2.statusCode}`);
                    let json = null;
                    try {
                        json = JSON.parse(body);
                    } catch (e) { /* ignore parse errors */
                    }
                    if (!err2 && res2.statusCode === HttpStatus.OK) {
                        res.status(HttpStatus.OK).send(result(HttpStatus.OK, json || body));
                    } else {
                        res.status(res2.statusCode).send(result(res2.statusCode, json || err2 || res2.statusMessage));
                        console.error(json || err2 || res2.statusMessage);
                    }
                    cleanTempDir();
                });
            });
        } catch (ex) {
            res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(result(HttpStatus.INTERNAL_SERVER_ERROR, ex));
        }
    });
});

function result(statusCode, msg) {
    const res = {};
    if (msg instanceof Error) {
        res['message'] = msg.toString();
        if (msg.stack) {
            res['stack'] = msg.stack.toString();
        }
    } else if (Array.isArray(msg)) {
        res['message'] = msg;
    } else if (typeof msg === 'object') {
        Object .assign(res, msg);
    } else if (msg) {
        res['message'] = msg.toString();
    }
    res['statusCode'] = statusCode;
    return res;
}

const server = app.listen(parseInt(process.argv[2] || '8080', 10), onListening);

function onListening(): void {
    const address = server.address();
    const bind = (typeof address === 'string') ? `pipe ${address}` : `port ${address.port}`;
    console.log(`Listening on ${bind}`);
}
