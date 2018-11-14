
/**
 * Looks for blocks of text starting with a line that matches the start
 * pattern and ends with a line that matches the end pattern. It then
 * passes that block to a filter and replaces the entire block with
 * the result returned by the filter function.
 * @param startPattern
 * @param endPattern
 * @param filter
 */
export function blocks(startPattern: string|RegExp,
                       endPattern: string | RegExp,
                       filter: (block: string[]) => string[]): (line: string) => string|string[] {
    let inBlock: boolean = false;
    let block: string[] = null;

    return line => {
        let res = null;
        if (!inBlock) {
            if (startPattern instanceof RegExp) {
                inBlock = startPattern.test(line);
            } else {
                inBlock = line.indexOf(startPattern) >= 0;
            }
            if (inBlock) {
                block = [ line ];
            } else {
                res = line;
            }
        } else {
            block.push(line);
            if (endPattern instanceof RegExp) {
                inBlock = !endPattern.test(line);
            } else {
                inBlock = line.indexOf(endPattern) < 0;
            }
            if (!inBlock) {
                res = filter(block);
                block = null;
            }
        }
        return res;
    };
}

/**
 * No-op blocks filter, just returns its input unchanged
 */
export function id(): (block: string[]) => string[] {
    return (block: string[]) => block;
}

/**
 * Blocks filter that will insert the given lines at the start of any code block.
 * The filter will take into account that all lines in the block must be separated
 * by commas. The last line in a block will never have a comma added.
 * @param lines The lines to insert
 */
export function insertAtStart(lines: string|string[]): (block: string[]) => string[] {
    return (block: string[]) => {
        let ls: string[];
        if (Array.isArray(lines)) {
            ls = [ ...lines ];
            ls = ls.reverse();
        } else {
            ls = [ lines ];
        }
        for (let line of ls) {
            if (block.length > 2) {
                line = ensureComma(line);
            } else {
                line = ensureNoComma(line);
            }
            block.splice(1, 0, line);
        }
        return block;
    };
}

/**
 * Blocks filter that will insert the given lines at the end of any code block.
 * The filter will take into account that all lines in the block must be separated
 * by commas. The last line in a block will never have a comma added.
 * @param lines The lines to insert
 */
export function insertAtEnd(lines: string | string[]): (block: string[]) => string[] {
    return (block: string[]) => {
        let ls: string[];
        if (Array.isArray(lines)) {
            ls = [ ...lines ];
        } else {
            ls = [ lines ];
        }
        for (let line of ls) {
            if (block.length > 2) {
                block[block.length - 2] = ensureComma(block[block.length - 2]);
            }
            line = ensureNoComma(line);
            block.splice(block.length - 1, 0, line);
        }
        return block;
    };
}

function ensureComma(line: string) {
    line = line.trimRight();
    if (!line.endsWith(',')) {
        line = line + ',';
    }
    return line;
}

function ensureNoComma(line: string) {
    line = line.trimRight();
    if (line.endsWith(',')) {
        line = line.slice(0, -1);
    }
    return line;
}
