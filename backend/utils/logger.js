export const logger = {
    info: (msg, meta = {}) => {
        const ts = new Date().toISOString();
        console.log(`[${ts}] INFO: ${msg}`, Object.keys(meta).length ? JSON.stringify(meta) : "");
    },
    error: (msg, meta = {}) => {
        const ts = new Date().toISOString();
        console.error(`[${ts}] ERROR: ${msg}`, Object.keys(meta).length ? JSON.stringify(meta) : "");
    }
};
