export default class Logger {
    private readonly prefix: string;

    constructor(prefix: string) {
        this.prefix = prefix;
    }

    private format(msg: string): string {
        const timestamp = new Date().toISOString();
        return `[${timestamp}] [${this.prefix}] ${msg}`;
    }

    debug(msg: string): void { console.debug(this.format(msg)); }
    info(msg: string): void { console.info(this.format(msg)); }
    warn(msg: string): void { console.warn(this.format(msg)); }
    error(msg: string): void { console.error(this.format(msg)); }
}