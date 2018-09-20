
// Transformer that can filter special CASE structures from a file
// determining whether to include or exclude those blocks of text
// depending on certain conditions.
// It does this by looking for lines that start with a line comment
// and a special token (by default "//$$" and then determines what
// to do with the following lines. Possible options are:
//
// $$CASE:keyName:value
//   If the property "keyName" has the value "value" in the given property
//   map then all following lines until the end of the block will be included
//   otherwise they will be dropped. All lines will have the first line
//   comments stripped. The block lasts until the next special token.
// $$
//   Signals the end of a CASE-block
//
// Example:
//
// function connect(host) {
// //$$CASE:database:postgresql
//     return ConnectionManager.connect("jdbc:postgresql" + host);
// //$$CASE:database:mysql
// //    return ConnectionManager.connect("jdbc:mysql" + host);
// //$$
// }
//
export function cases(props, lineComment = '//') {
    let inCase = false;
    let skipBlock = false;

    const start = lineComment + '$$';

    return line => {
        const trimmedLine = line.trim();
        let skipLine = false;

        // Check if this is a special "command line"
        let cmd, key, value;
        if (trimmedLine.startsWith(start)) {
            [cmd, key, value] = trimmedLine.slice(start.length).split(':');
            if (cmd === 'CASE') {
                inCase = true;
                skipBlock = props[key] !== value;
            } else if (!cmd) {
                inCase = false;
            }
            skipLine = true;
        }

        if (skipLine || (inCase && skipBlock)) {
            return null;
        } else if (inCase) {
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
