const assert = require('assert');

const middleware = require('../../middleware/attributes');

describe('attributes middleware', function() {
    let event, resumed;

    function resume() {
        resumed = true;

        return 'resumed';
    }

    beforeEach(function() {
        event = {
            __invocationSpec: {
                route: 'unittest.event#effect',
                triggerSpec: {
                    context: {}
                }
            },
            context: {}
        };

        resumed = false;
    })

    it('resumes if the trigger does not define context attributes', function() {
        delete event.__invocationSpec.triggerSpec.context;

        assert.strictEqual(middleware(event, resume), 'resumed');
        assert(resumed);
    })

    it('resumes if there is no invocation spec', function() {
        delete event.__invocationSpec;

        assert.strictEqual(middleware(event, resume), 'resumed');
    })

    describe('required attribute', function() {
        beforeEach(function() {
            event.__invocationSpec.triggerSpec.context.session$ = 'complex';
        })

        it('fails if attribute is not provided', function() {
            assert.throws(z => middleware(event, resume), {
                name: 'RequiredAttributeError',
                route: 'unittest.event#effect',
                attribute: 'session$',
                message: 'call to event trigger (route="unittest.event#effect") does not provide required context attribute (name="session$")'
            });

            assert(!resumed);
        })

        it('resumes if attribute is provided', function() {
            event.context.session$ = {};

            assert.strictEqual(middleware(event, resume), 'resumed');
        })

        it('accepts falsy attribute values', function() {
            event.context.session$ = null;

            assert.strictEqual(middleware(event, resume), 'resumed');
        })
    })

    describe('optional attribute', function() {
        beforeEach(function() {
            event.__invocationSpec.triggerSpec.context.user$ = { type: 'complex', optional: true };
        })

        it('resumes if attribute is not provided', function() {
            assert.strictEqual(middleware(event, resume), 'resumed');
        })
    })
})
