import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as cors from 'cors';
import * as catalog from './core/catalog/index';
import * as deploy from './core/deploy/index';
import { resources } from './core/resources/index';
import * as Archiver from 'archiver';
import * as tmp from 'tmp';

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
                const archive = Archiver('zip');
                // good practice to catch warnings (ie stat failures and other non-blocking errors)
                archive.on('warning', (err) =>{
                    if (err.code === 'ENOENT') {
                        // log warning
                        console.log(err);
                    } else {
                        // throw error
                        throw err;
                    }
                });
                // good practice to catch this error explicitly
                archive.on('error', (zipErr) => {
                    throw zipErr;
                });
                // Clean the temp dir after closing
                archive.on('close', ()=>{
                    cleanTempDir();
                })
                // Send the file to the page output.
                archive.pipe(res);
                // append files from tempDir, putting its contents at the root of archive
                archive.directory(tempDir, false);
                archive.finalize();
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
