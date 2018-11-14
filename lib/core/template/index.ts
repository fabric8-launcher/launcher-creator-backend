
import { Transform } from 'stream';
import { createReadStream, createWriteStream, move, statSync } from 'fs-extra';
import { tmpNameSync } from 'tmp';
import * as fg from 'fast-glob';

class LineTransform extends Transform {
    private transformLine: (line: string) => string|string[];
    private buf: string;
    private lastLineSep: string = '\n';

    constructor(transformLine: (line: string) => string|string[], options) {
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
            const line = parts[i];
            this.lastLineSep = parts[i + 1];
            const lines = this.transformLine(line);
            if (!this.skipLines(lines)) {
                this.pushLines(lines, this.lastLineSep);
            }
        }
        this.buf = (parts.length % 2 === 0) ? '' : parts[parts.length - 1];
        cb();
    }

    public _flush(cb) {
        if (this.buf !== '') {
            const lines = this.transformLine(this.buf);
            if (!this.skipLines(lines)) {
                this.pushLines(lines);
            }
        }
        cb();
    }

    private skipLines(lines: string|string[]) {
        if (Array.isArray(lines)) {
            return lines.length === 0;
        } else {
            return lines === null || lines === undefined;
        }
    }

    private pushLines(lines: string|string[], lineSep: string = null) {
        if (Array.isArray(lines)) {
            const joined = lines.join(lineSep || this.lastLineSep);
            this.push(joined);
        } else {
            this.push(lines);
        }
        if (lineSep) {
            this.push(lineSep);
        }
    }
}

export function transform(inFile: string, outFile: string, transformLine: (line: string) => string|string[]): Promise<string> {
    const actualOutFile = (outFile === inFile || !outFile) ? tmpNameSync() : outFile;

    const ins = createReadStream(inFile);

    const instat = statSync(inFile);
    const outs = createWriteStream(actualOutFile, { 'mode': instat.mode });

    return new Promise((resolve, reject) => {
        ins
            .pipe(new LineTransform(transformLine, {}))
            .pipe(outs)
            .on('finish', async () => {
                if (outFile !== actualOutFile) {
                    await move(actualOutFile, inFile, { 'overwrite': true });
                    resolve(inFile);
                } else {
                    resolve(outFile);
                }
            });
    });
}

export function transformFiles(pattern: string|string[], transformLine: (line: string) => string|string[]): Promise<number> {
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
