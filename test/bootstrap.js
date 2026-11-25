const { default: DependencyContainer } = require('gell-dependency/container');

/**
 * Logger that records messages instead of writing them
 */
function testLogger() {
	const messages = [];
	const log = level => message => messages.push({ level, message });

	return { messages, debug: log('debug'), info: log('info'), warn: log('warn'), error: log('error') };
}

function setupContext() {
	this.logger = testLogger();

	this.deps = new DependencyContainer({
		logger: this.logger
	});
}

exports.mochaHooks = {
	beforeEach: [
		setupContext
	]
}
