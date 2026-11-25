const assert = require('assert');

const { error } = require('../../util/error');

describe('error', function() {
    it('creates an Error with a name and message', function() {
        const e = error('RequiredParameterError', 'gello!');

        assert(e instanceof Error);
        assert.strictEqual(e.name, 'RequiredParameterError');
        assert.strictEqual(e.message, 'gello!');
    })

    it('formats the message with arguments', function() {
        const e = error('RequiredParameterError', 'route (name="%s") argument (name="%s")', {}, 'my.event#action', 'message');

        assert.strictEqual(e.message, 'route (name="my.event#action") argument (name="message")');
    })

    it('assigns attributes to the error', function() {
        const e = error('ForbiddenError', 'gello!', { status: 403, route: 'my.event#action' });

        assert.strictEqual(e.status, 403);
        assert.strictEqual(e.route, 'my.event#action');
    })

    it('does not let attributes replace the name or message', function() {
        const e = error('ForbiddenError', 'gello!', { name: 'Other', message: 'other' });

        assert.strictEqual(e.name, 'ForbiddenError');
        assert.strictEqual(e.message, 'gello!');
    })
})
