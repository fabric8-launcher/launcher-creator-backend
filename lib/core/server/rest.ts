import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as cors from 'cors';
import * as catalog from '../catalog';
import * as deploy from '../deploy';
import { resources } from '../resources';
import Archiver from 'archiver';
import * as tmp from 'tmp';

tmp.setGracefulCleanup();
const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.use(cors());
//app.options('*', cors());

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

app.post('/create', (req, res) => {
// Create temp dir
    tmp.dir({unsafeCleanup: true}, (err, tempDir, cleanTempDir) => {
        // Generate contents TODO: Use request parameters
        const appName = 'my-database';
        deploy.apply(appName, resources({}), tempDir, 'database', { databaseType : 'postgresql', runtime:  'vertx' })
            .then(() => {
                // Tell the browser that this is a zip file.
                res.writeHead(200, {
                    'Content-Type': 'application/zip',
                    'Content-disposition': `attachment; filename=${appName}.zip`
                });
                const zip = Archiver('zip');
                // good practice to catch this error explicitly
                zip.on('error', (err) => {
                    throw err;
                });
                // Send the file to the page output.
                zip.pipe(res);
                // append files from tempDir, putting its contents at the root of archive
                zip.directory(tempDir, false);
                zip.finalize();
            })
            .catch(err => res.status(500).send(err))
            .finally(() => cleanTempDir());
    });
});

const rest = app.listen(8080, onListening);

function onListening(): void {
    const address = rest.address();
    const bind = (typeof address === 'string') ? `pipe ${address}` : `port ${address.port}`;
    console.log(`Listening on ${bind}`);
}
