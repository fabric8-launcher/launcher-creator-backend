
import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as cors from 'cors';
import * as Archiver from 'archiver';
import * as tmp from 'tmp';

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
        .catch(err => res.status(500).send(err));
});

app.get('/generators', (req, res) => {
    catalog.listGenerators()
        .then(caps => res.status(200).send(caps))
        .catch(err => res.status(500).send(err));
});

app.get('/runtimes', (req, res) => {
    catalog.listRuntimes()
        .then(list => res.status(200).send(list))
        .catch(err => res.status(500).send(err));
});

app.get('/create', (req, res) => {
    // Create temp dir
    tmp.dir({'unsafeCleanup': true}, (err, tempDir, cleanTempDir) => {
        // Generate contents TODO: Use request parameters
        const appName = 'my-database';
        deploy.apply(appName, resources({}), tempDir, 'database', { 'databaseType' : 'postgresql', 'runtime':  'vertx' })
            .then(() => {
                // Tell the browser that this is a zip file.
                res.writeHead(200, {
                    'Content-Type': 'application/zip',
                    'Content-disposition': `attachment; filename=${appName}.zip`
                });
                return zipFolder(res, tempDir, appName)
                    .finally(() => cleanTempDir());
            })
            .catch(promErr => res.status(500).send(promErr));
    });
});

const server = app.listen(8080, onListening);

function onListening(): void {
    const address = server.address();
    const bind = (typeof address === 'string') ? `pipe ${address}` : `port ${address.port}`;
    console.log(`Listening on ${bind}`);
}
