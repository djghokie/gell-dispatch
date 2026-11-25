const { format } = require('util');

/**
 * Creates an Error describing a failed event invocation
 *
 * @param {*} name - error name (e.g. RequiredParameterError)
 * @param {*} message - printf style message (see util.format)
 * @param {*} attributes - additional properties assigned to the error (e.g. route, status)
 * @param  {...any} args - message arguments
 */
function error(name, message, attributes={}, ...args) {
    return Object.assign(new Error(), attributes, { name, message: format(message, ...args) });
}

module.exports = { error };
