
import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as cors from 'cors';
import * as tmp from 'tmp';
import * as request from 'request';
import { PassThrough } from 'stream';

import * as catalog from './core/catalog';
import * as deploy from './core/deploy';
import { resources } from './core/resources';
import { zipFolder } from './core/utils';

tmp.setGracefulCleanup();
const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({'extended': true}));

app.use(cors());

app.get('/', (req, res) => {
    const url = req.protocol + '://' + req.get('host') + req.originalUrl + 'swagger.yaml';
    res.redirect(`${req.protocol}://editor.swagger.io/?url=${url}`);
});

app.use('/swagger.yaml', express.static('./swagger.yaml'));

app.get('/capabilities', (req, res) => {
    catalog.listCapabilities()
        .then(caps => res.status(200).send(caps))
        .catch(err => res.status(500).send(result(500, err)));
});

app.get('/generators', (req, res) => {
    catalog.listGenerators()
        .then(caps => res.status(200).send(caps))
        .catch(err => res.status(500).send(result(500, err)));
});

app.get('/runtimes', (req, res) => {
    catalog.listRuntimes()
        .then(list => res.status(200).send(list))
        .catch(err => res.status(500).send(result(500, err)));
});

app.get('/zip', (req, res) => {
    // Create temp dir
    tmp.dir({'unsafeCleanup': true}, (err, tempDir, cleanTempDir) => {
        // Generate contents
        deploy.apply(resources({}), tempDir, req.query.name, req.query.runtime, normalizeCapabilities(req.query.capability))
            .then(() => {
                // Tell the browser that this is a zip file.
                res.writeHead(200, {
                    'Content-Type': 'application/zip',
                    'Content-disposition': `attachment; filename=${req.query.name}.zip`
                });
                return zipFolder(res, tempDir, req.query.name)
                    .finally(() => cleanTempDir());
            })
            .catch(promErr => res.status(500).send(result(500, promErr)));
    });
});

app.post('/launch', (req, res) => {
    // Make sure we're autenticated
    if (!req.header('Authorization')) {
        res.status(401).send(result(400, 'Unauthorized'));
        return;
    }
    // Create temp dir
    tmp.dir({'unsafeCleanup': true}, (err, tempDir, cleanTempDir) => {
        // Generate contents
        deploy.apply(resources({}), tempDir, req.body.name, req.body.runtime, req.body.capabilities)
            .then(() => {
                const passThru = new PassThrough();
                // Prepare to zip
                zipFolder(passThru, tempDir, req.body.name)
                    .finally(() => cleanTempDir());
                // Prepare to post
                const formData = {
                    'projectName': req.body.projectName,
                    'gitRepository': req.body.gitRepository,
                    'gitOrganization': req.body.gitOrganization,
                    'file': passThru
                };
                const auth = {
                    'bearer': req.header('Authorization').slice(7)
                };
                const headers = {
                    'X-OpenShift-Cluster': req.body.clusterId
                };
                const options = {
                    'url': 'http://localhost:8080/api/launcher/upload',
                    formData,
                    auth,
                    headers
                };
                console.log('OPTIONS ', options);
                request.post(options, (err2, res2, body) => {
                        if (err2) {
                            res.status(200).send(result(200, err2));
                        } else {
                            res.status(res2.statusCode).send({'code': res2.statusCode, 'message': res2.statusMessage});
                        }
                    })
                    .on('error', reqErr => reqErr);
            })
            .catch(promErr => res.status(500).send(result(500, promErr)));
    });
});

function normalizeCapabilities(items) {
    if (Array.isArray(items)) {
        return items.map(i => (i.trim().startsWith('{')) ? JSON.parse(i) : {'module': i});
    } else {
        return [{'module': items}];
    }
}

function result(code, msg) {
    const res = { 'code': code };
    if (msg instanceof Error) {
        res['message'] = msg.toString();
        if (msg.stack) {
            res['stack'] = msg.stack.toString();
        }
    } else if (msg) {
        res['message'] = msg.toString();
    }
    return res;
}

const server = app.listen(parseInt(process.argv[2] || '8080', 10), onListening);

function onListening(): void {
    const address = server.address();
    const bind = (typeof address === 'string') ? `pipe ${address}` : `port ${address.port}`;
    console.log(`Listening on ${bind}`);
}
