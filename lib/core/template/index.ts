
import { Transform } from 'stream';
import { createReadStream, createWriteStream, move, statSync } from 'fs-extra';
import { tmpNameSync } from 'tmp';
import * as fg from 'fast-glob';

class LineTransform extends Transform {
    private transformLine: (line: string) => string;
    private buf: string;

    constructor(transformLine: (line: string) => string, options) {
        super(options);
        this.transformLine = transformLine;
        this.buf = '';
    }

    public _transform(chunk, encoding, cb) {
        const str = (Buffer.isBuffer(chunk) || encoding === 'buffer') ? chunk.toString('utf8') : chunk;
        this.buf += str;
        const parts = this.buf.split(/(\r?\n)/);
        const len = 2 * Math.floor(parts.length / 2);
        for (let i = 0; i < len; i += 2) {
            const line = this.transformLine(parts[i]);
            if (line !== null && line !== undefined) {
                this.push(line);
                this.push(parts[i + 1]);
            }
        }
        this.buf = (parts.length % 2 === 0) ? '' : parts[parts.length - 1];
        cb();
    }

    public _flush(cb) {
        if (this.buf !== '') {
            const line = this.transformLine(this.buf);
            if (line !== null && line !== undefined) {
                this.push(line);
            }
        }
        cb();
    }
}

export function transform(inFile: string, outFile: string, transformLine: (line: string) => string) {
    const actualOutFile = (outFile === inFile || !outFile) ? tmpNameSync() : outFile;

    const ins = createReadStream(inFile);

    const instat = statSync(inFile);
    const outs = createWriteStream(actualOutFile, { 'mode': instat.mode });

    return new Promise((resolve, reject) => {
        ins
            .pipe(new LineTransform(transformLine, {}))
            .pipe(outs)
            .on('finish', () => {
                if (outFile !== actualOutFile) {
                    resolve(move(actualOutFile, inFile, { 'overwrite': true })
                        .then(() => inFile));
                } else {
                    resolve(outFile);
                }
            });
    });
}

export function transformFiles(pattern: string|string[], transformLine: (line: string) => string): Promise<number> {
    let result = Promise.resolve(0);
    return new Promise((resolve, reject) => {
        fg.stream(pattern)
            .on('data', entry => {
                result = result.then((cnt) =>
                    transform(entry, null, transformLine).then(() => cnt + 1));
            })
            .on('error', err => reject(err))
            .on('end', () => resolve(result));
    });
}
