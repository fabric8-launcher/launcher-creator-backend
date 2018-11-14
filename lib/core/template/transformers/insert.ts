
/**
 * Inserts the given line(s) after any lines encountered that match the pattern
 * @param pattern Either a string that matches any part of the line or a RegExp
 * @param text Either a single string or an array of strings to be inserted
 */
export function insertBefore(pattern: string|RegExp, text: string|string[]): (line: string) => string|string[] {
    return line => {
        let match = false;
        if (pattern instanceof RegExp) {
            match = pattern.test(line);
        } else {
            match = line.indexOf(pattern) >= 0;
        }
        let res;
        if (match) {
            if (Array.isArray(text)) {
                res = [...text, line];
            } else {
                res = [text, line];
            }
        } else {
            res = line;
        }
        return res;
    };
}

/**
 * Inserts the given line(s) before any lines encountered that match the pattern
 * @param pattern Either a string that matches any part of the line or a RegExp
 * @param text Either a single string or an array of strings to be inserted
 */
export function insertAfter(pattern: string | RegExp, text: string | string[]): (line: string) => string | string[] {
    return line => {
        let match = false;
        if (pattern instanceof RegExp) {
            match = pattern.test(line);
        } else {
            match = line.indexOf(pattern) >= 0;
        }
        let res;
        if (match) {
            if (Array.isArray(text)) {
                res = [line, ...text];
            } else {
                res = [line, text];
            }
        } else {
            res = line;
        }
        return res;
    };
}
