const _ = require('lodash');

const { default: State } = require('gell-state');

/**
 * Resolves event routes ("event.name#trigger") from a map of event modules
 *  - yields [module, { resource, f }, { resource: eventName, f: triggerName }] as gell-dispatch/bus expects
 *
 * NOTE: test double for gell-session/dispatch/resolver (directory)
 *
 * @param {*} events
 */
module.exports = function* (events) {
	let name = yield new State();

	while (true) {
		if (_.isString(name)) {
			const [resourceName, functionName] = name.split('#');
			const resource = resourceName ? events[resourceName] : undefined;
			const f = resource && functionName ? resource[functionName] : undefined;

			name = yield [resource, { resource, f }, { resource: resourceName, f: functionName }];
		}
		else name = yield [];
	}
}
