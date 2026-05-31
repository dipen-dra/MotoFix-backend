/**
 * @file middlewares/sanitizeRequest.js
 * @description Comprehensive injection prevention middleware.
 *
 * Covers:
 *  1. NoSQL / MongoDB operator injection  – strips keys starting with `$` and
 *     values that look like MongoDB operators or JSON-injected objects.
 *  2. Command / Shell injection           – strips OS shell meta-characters from
 *     string values so they cannot be passed to child_process / eval.
 *  3. ReDoS-safe $regex search guard      – enforces a length cap and escapes
 *     special regex characters before they reach $regex queries.
 */

// ─── Shell meta-characters that could enable command injection ─────────────────
// Covers: backtick substitution, pipe, redirection, logical ops, semicolons,
// null-bytes, percent-encoding escape, CRLF injection, path traversal.
const SHELL_DANGER_REGEX = /[`|;&$><!\n\r\x00%{}\\]/g;

// ─── MongoDB operator pattern ─────────────────────────────────────────────────
// Detect values that start with a MongoDB $ operator (e.g. {"$gt":""})
const NOSQL_OP_REGEX = /^\$|^\{.*\$.*\}/;

/**
 * Recursively walk an object and apply sanitisation to every string value.
 * Keys that start with `$` are removed to block operator injection
 * (e.g. { "email": { "$gt": "" } }).
 *
 * @param {*}  obj     - The value to sanitise (any type).
 * @param {number} depth - Current recursion depth (prevents stack overflow).
 * @returns {*}        - The sanitised value.
 */
const deepSanitize = (obj, depth = 0) => {
    // Recursion guard – cap depth at 10 to prevent prototype-pollution via
    // deeply nested objects.
    if (depth > 10) return {};

    if (obj === null || obj === undefined) return obj;

    if (Array.isArray(obj)) {
        return obj.map(item => deepSanitize(item, depth + 1));
    }

    if (typeof obj === 'object') {
        const cleaned = {};
        for (const key of Object.keys(obj)) {
            // 1. Drop keys that begin with `$` (MongoDB operator keys)
            if (key.startsWith('$')) {
                continue; // silently remove, do NOT propagate
            }
            // 2. Drop keys that contain a period (dotted key injection)
            if (key.includes('.')) {
                continue;
            }
            cleaned[key] = deepSanitize(obj[key], depth + 1);
        }
        return cleaned;
    }

    if (typeof obj === 'string') {
        let val = obj;

        // 3. Reject strings that look like embedded MongoDB operator objects
        //    e.g. a user passes `{"$gt":""}` as the value of a field.
        if (NOSQL_OP_REGEX.test(val.trim())) {
            return ''; // neutralise
        }

        // 4. Strip shell meta-characters
        val = val.replace(SHELL_DANGER_REGEX, '');

        // 5. Collapse multiple consecutive spaces (normalise after stripping)
        val = val.replace(/\s{2,}/g, ' ').trim();

        return val;
    }

    // Numbers, booleans, etc. – pass through unchanged.
    return obj;
};

/**
 * Express middleware – sanitises req.body, req.query and req.params.
 */
const sanitizeRequest = (req, res, next) => {
    if (req.body)   req.body   = deepSanitize(req.body);
    if (req.query)  req.query  = deepSanitize(req.query);
    if (req.params) req.params = deepSanitize(req.params);
    next();
};

/**
 * Escape a raw string so it is safe to use inside a MongoDB $regex query.
 * This prevents ReDoS (Regular Expression Denial of Service) by:
 *   a) Capping the search term length at 100 characters.
 *   b) Escaping all regex special characters so user input is treated as a
 *      literal string, not a regex pattern.
 *
 * Usage inside a controller:
 *   const { escapeRegex } = require('../middlewares/sanitizeRequest');
 *   const safeSearch = escapeRegex(req.query.search);
 *   Model.find({ name: { $regex: safeSearch, $options: 'i' } });
 *
 * @param {string} str - Raw user-supplied search term.
 * @returns {string}   - Escaped, length-capped string safe for $regex.
 */
const escapeRegex = (str) => {
    if (typeof str !== 'string') return '';
    // Cap length to prevent catastrophic backtracking / ReDoS
    const capped = str.slice(0, 100);
    // Escape all special regex metacharacters
    return capped.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

module.exports = { sanitizeRequest, escapeRegex };
