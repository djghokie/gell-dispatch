const _ = require('lodash');

const { error } = require('../util/error');

const MESSAGE_REQUIRED_PARAMETER = 'call to event trigger (route="%s") does not provide required argument (name="%s")';
const MESSAGE_PARAMETER_MAXLENGTH = 'call to event trigger (route="%s") has argument (name="%s") that exceeds maximum allowed length';
const MESSAGE_PARAMETER_TYPE = 'call to event trigger (route="%s") has argument (name="%s") that is not of type (type="%s")';

/**
 * gell-dispatch middleware that validates event invocation parameters against the event metadata
 * 
 * WIP: use gell-domain here to validate this correctly
 * 
 * WIP: this isn't yet re-usable because of the error message
 *  - one approach would be to collect validation failures and throw at the end
 *      - short circuit
 */
module.exports = function(event, resume) {
    const { params: values, __invocationSpec } = event;
    
    if (!__invocationSpec) return resume(event);
    
    const metadata = __invocationSpec.triggerSpec.params || {};
    const route = __invocationSpec.route;

    const keys = Object.keys(metadata || {});
    keys.forEach(n => {
        const param = metadata[n];
        const val = values[n];

        if (val === undefined && !param.optional) {
            throw error('RequiredParameterError', MESSAGE_REQUIRED_PARAMETER, { route, parameter: n }, route, n);
        }

        // NOTE: omitted optional parameters are not type checked
        if (val === undefined) return;

        if (param.type === 'string') {
            if (!_.isString(val)) {
                throw error('ParameterValidationError', MESSAGE_PARAMETER_TYPE, { route, parameter: n, type: param.type }, route, n, param.type);
            }

            if (param.maxLength && val.length > param.maxLength) {
                throw error('ParameterValidationError', MESSAGE_PARAMETER_MAXLENGTH, { route, parameter: n }, route, n);
            }
        }
    })

    return resume(event);
}
