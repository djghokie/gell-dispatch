const assert = require('assert');

const { eventSink } = require('../../stream/sink');

/**
 * Store whose write transactions record the operations written to them and whether they were committed
 */
function fakeStore() {
	const transactions = [];

	return {
		transactions,
		write() {
			const txn = { operations: [], committed: false };
			transactions.push(txn);

			return {
				next(operation) { txn.operations.push(operation); return { value: undefined }; },
				return() { txn.committed = true; return { value: Promise.resolve(), done: true }; },
			};
		}
	}
}

describe('event sink', function() {
	let store, $sink, received;

	const EVENT = {
		__metadata: { name: 'unittest.event' },

		effect: async ({ context, deps }) => {
			received.push({ context, deps, committed: store.transactions.map(t => t.committed) });

			context.$txn.next({ operation: 'put', item: { id: context.id } });

			return `effect ${context.id}`;
		}
	};

	beforeEach(function() {
		store = fakeStore();
		received = [];

		this.deps.define('store', store);

		$sink = eventSink(EVENT, this.deps);
		$sink.next();
	})

	it('invokes the event effect with the context and deps', async function() {
		await $sink.next({ context: { id: '100' } }).value;

		assert.strictEqual(received.length, 1);
		assert.strictEqual(received[0].context.id, '100');
		assert.strictEqual(received[0].deps, this.deps);
	})

	it('resolves the result of the effect', async function() {
		assert.strictEqual(await $sink.next({ context: { id: '100' } }).value, 'effect 100');
	})

	it('provides a new transaction and the deps in the context', async function() {
		await $sink.next({ context: { id: '100' } }).value;

		const { context } = received[0];

		assert(context.$txn);
		assert.strictEqual(context.deps, this.deps);
		assert.deepStrictEqual(store.transactions[0].operations, [{ operation: 'put', item: { id: '100' } }]);
	})

	it('commits the transaction after the effect', async function() {
		await $sink.next({ context: { id: '100' } }).value;

		assert.deepStrictEqual(received[0].committed, [false]);
		assert.strictEqual(store.transactions[0].committed, true);
	})

	it('uses a transaction per invocation', async function() {
		await $sink.next({ context: { id: '100' } }).value;
		await $sink.next({ context: { id: '200' } }).value;

		assert.strictEqual(store.transactions.length, 2);
		assert.deepStrictEqual(store.transactions[1].operations, [{ operation: 'put', item: { id: '200' } }]);
	})

	it('invokes the effect without arguments', async function() {
		const event = { ...EVENT, effect: async ({ context }) => Object.keys(context).sort() };

		$sink = eventSink(event, this.deps);
		$sink.next();

		assert.deepStrictEqual(await $sink.next().value, ['$txn', 'deps']);
	})

	it('does not commit the transaction if the effect fails', async function() {
		const event = { ...EVENT, effect: async () => { throw new Error('failed'); } };

		$sink = eventSink(event, this.deps);
		$sink.next();

		await assert.rejects(async z => $sink.next({ context: {} }).value, /failed/);

		assert.strictEqual(store.transactions[0].committed, false);
	})

	it('logs the invocation', async function() {
		await $sink.next({ context: { id: '100' } }).value;

		assert.deepStrictEqual(this.logger.messages, [{ level: 'info', message: 'invoking event (name=unittest.event)' }]);
	})
})
