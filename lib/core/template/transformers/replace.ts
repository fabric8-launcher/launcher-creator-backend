
/**
 * Replaces any lines encountered that match the pattern with the given line(s)
 * @param pattern Either a string that matches any part of the line or a RegExp
 * @param text Either a single string or an array of strings to be inserted
 */
export function replace(pattern: string|RegExp, text: string|string[]): (line: string) => string|string[] {
    return line => {
        let match = false;
        if (pattern instanceof RegExp) {
            match = pattern.test(line);
        } else {
            match = line.indexOf(pattern) >= 0;
        }
        let res;
        if (match) {
            res = text;
        } else {
            res = line;
        }
        return res;
    };
}
