
import { Transform } from 'stream';
import { createReadStream, createWriteStream, move } from 'fs-extra';
import { tmpNameSync } from 'tmp';

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
    const actualOutFile = (outFile === inFile) ? tmpNameSync() : outFile;
    const ins = createReadStream(inFile);
    const outs = createWriteStream(actualOutFile);

    return new Promise((resolve, reject) => {
        ins
            .pipe(new LineTransform(transformLine, {}))
            .pipe(outs)
            .on('finish', () => {
                if (outFile !== actualOutFile) {
                    resolve(move(actualOutFile, outFile, { 'overwrite': true })
                        .then(() => outFile));
                } else {
                    resolve(outFile);
                }
            });
    });
}