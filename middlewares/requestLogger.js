const logger = require('../utils/logger');

module.exports = (req, res, next) => {
    const start = Date.now();

    // Attach response event to log request completion
    res.on('finish', () => {
        const duration = Date.now() - start;
        const statusCode = res.statusCode;

        const logData = {
            ip: req.ip || req.connection.remoteAddress,
            method: req.method,
            url: req.originalUrl || req.url,
            statusCode,
            duration: `${duration}ms`,
            userAgent: req.headers['user-agent'],
            query: req.query,
            body: req.body
        };

        if (statusCode >= 500) {
            // Level error: Critical crash (Status 500)
            logger.error(`Critical Exception: ${req.method} ${logData.url} - ${statusCode}`, { metadata: logData });
        } else if (statusCode === 401 || statusCode === 403 || statusCode === 429) {
            // Level warn: Security alert (Status 401, 403, 429)
            logger.warn(`Security Warning / Access Denied: ${req.method} ${logData.url} - ${statusCode}`, { metadata: logData });
        } else {
            // Level info: General traffic (Status 2xx/3xx/etc)
            logger.info(`General Traffic: ${req.method} ${logData.url} - ${statusCode}`, { metadata: logData });
        }
    });

    next();
};
