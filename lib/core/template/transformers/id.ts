/**
 * A simple no-op transformer
 */
export function id(): (line: string) => string|string[] {
    return line => line;
}
