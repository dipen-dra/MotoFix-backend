const winston = require('winston');
const path = require('path');
require('winston-daily-rotate-file');

// Define sensitive fields to be redacted automatically
const redactFields = ['password', 'token', 'newpassword', 'oldpassword', 'secret', 'authorization'];

const redact = (obj) => {
    if (typeof obj !== 'object' || obj === null) return obj;
    if (Array.isArray(obj)) {
        return obj.map(item => redact(item));
    }
    const newObj = {};
    for (const key in obj) {
        if (redactFields.includes(key.toLowerCase())) {
            newObj[key] = '[REDACTED]';
        } else if (typeof obj[key] === 'object') {
            newObj[key] = redact(obj[key]);
        } else {
            newObj[key] = obj[key];
        }
    }
    return newObj;
};

const redactFormat = winston.format((info) => {
    // Redact top level message if it's an object or string
    if (typeof info.message === 'object') {
        info.message = redact(info.message);
    } else if (typeof info.message === 'string') {
        redactFields.forEach(field => {
            const regex = new RegExp(`("${field}"\\s*:\\s*")[^"]+(")`, 'gi');
            info.message = info.message.replace(regex, `$1[REDACTED]$2`);
        });
    }

    // Redact other fields in info metadata
    for (const key in info) {
        if (redactFields.includes(key.toLowerCase())) {
            info[key] = '[REDACTED]';
        } else if (typeof info[key] === 'object') {
            info[key] = redact(info[key]);
        }
    }
    return info;
});

// Configure separate transports to enforce strict 3-layer categorization
const accessTransport = new winston.transports.DailyRotateFile({
    filename: 'logs/%DATE%-access.log',
    datePattern: 'YYYY-MM-DD',
    maxFiles: '90d',
    level: 'info',
    format: winston.format.combine(
        winston.format((info) => info.level === 'info' ? info : false)(),
        winston.format.timestamp(),
        redactFormat(),
        winston.format.json()
    )
});

const auditTransport = new winston.transports.DailyRotateFile({
    filename: 'logs/%DATE%-audit.log',
    datePattern: 'YYYY-MM-DD',
    maxFiles: '90d',
    level: 'warn',
    format: winston.format.combine(
        winston.format((info) => info.level === 'warn' ? info : false)(),
        winston.format.timestamp(),
        redactFormat(),
        winston.format.json()
    )
});

const errorTransport = new winston.transports.DailyRotateFile({
    filename: 'logs/%DATE%-error.log',
    datePattern: 'YYYY-MM-DD',
    maxFiles: '90d',
    level: 'error',
    format: winston.format.combine(
        winston.format((info) => info.level === 'error' ? info : false)(),
        winston.format.timestamp(),
        redactFormat(),
        winston.format.json()
    )
});

const logger = winston.createLogger({
    levels: winston.config.npm.levels,
    format: winston.format.combine(
        winston.format.timestamp(),
        redactFormat(),
        winston.format.json()
    ),
    transports: [
        accessTransport,
        auditTransport,
        errorTransport
    ]
});

// Console logging in development
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
        )
    }));
}

module.exports = logger;
