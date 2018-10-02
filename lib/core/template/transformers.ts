
// Transformer that can filter special if-structures from a file
// determining whether to include or exclude those blocks of text
// depending on certain conditions.
// It does this by looking for lines that start with a line comment
// and a special token (by default "//$$" and then determines what
// to do with the following lines. Possible options are:
//
// {{if keyName==value}}
//   If the property "keyName" has the value "value" in the given property
//   map then all following lines until the end of the block will be included
//   otherwise they will be dropped. All lines will have the first line
//   comments stripped. The block lasts until the next special token.
// {{else}}
// {{end}}
//   Signals the end of a if-block
//
// Example:
//
// function connect(host) {
// //{{if database==postgresql}}
//     return ConnectionManager.connect("jdbc:postgresql" + host);
// //{{else if database==mysql}}
// //    return ConnectionManager.connect("jdbc:mysql" + host);
// //{{end}}
// }
//
export function cases(props: object, lineComment: string = '//'): (line: string) => string {
    let inIf = false;
    let skipElse = false;
    let skipBlock = false;
    let foundElse = false;

    const start = lineComment + '{{';
    const end = '}}';

    return line => {
        const trimmedLine = line.trim();
        let skipLine = false;

        // Check if this is a special "command line"
        if (trimmedLine.startsWith(start) && trimmedLine.endsWith(end)) {
            const inner = trimmedLine.slice(start.length, trimmedLine.length - end.length).trim();
            if (inner.startsWith('if ')) {
                if (inIf) {
                    throw new Error('if cannot be nested');
                }
                inIf = true;
                skipBlock = !testCondition(inner.slice(3), props);
                skipElse = !skipBlock;
                foundElse = false;
            } else if (inner.startsWith('else if ')) {
                if (!inIf) {
                    throw new Error('else-if without if');
                }
                if (foundElse) {
                    throw new Error('else-if after else');
                }
                if (!skipElse) {
                    skipBlock = !testCondition(inner.slice(8), props);
                    skipElse = !skipBlock;
                } else {
                    skipBlock = true;
                }
            } else if (inner === 'else') {
                if (!inIf) {
                    throw new Error('else without if');
                }
                skipBlock = skipElse;
                foundElse = true;
            } else if (inner === 'end') {
                if (!inIf) {
                    throw new Error('end without if');
                }
                inIf = false;
            }
            skipLine = true;
        }

        // Perform any variable replacements
        const re = new RegExp('{{\s*\.([a-zA-Z-]+)\s*}}', 'g');
        line = line.replace(re, (match, key) => props[key]);

        if (skipLine || (inIf && skipBlock)) {
            return null;
        } else if (inIf) {
            let ln = line;
            // Remove any leading comment characters from the line
            const idx = ln.indexOf(lineComment);
            if (idx >= 0) {
                ln = ln.slice(0, idx) + ln.slice(idx + lineComment.length);
            }
            return ln;
        } else {
            return line;
        }
    };
}

function testCondition(cond: string, props: object): boolean {
    const parts = cond.split('==');
    const key = parts[0].trim().slice(1);
    if (parts.length > 1) {
        return props[key] === parts[1].trim();
    } else {
        return !!props[key];
    }
}
