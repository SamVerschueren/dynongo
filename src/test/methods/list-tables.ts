import test from 'ava';
import sinon from 'sinon';
import stubPromise from '../fixtures/stub-promise';
import db from '../..';

db.connect();

const sandbox = sinon.createSandbox();
let listTablesStub;

test.before(() => {
	listTablesStub = sandbox.stub(db.raw !, 'listTables');
	listTablesStub.onFirstCall().returns(stubPromise({LastEvaluatedTableName: 'test.baz', TableNames: ['test.baz']}));
	listTablesStub.returns(stubPromise({TableNames: ['test.foo', 'test.bar', 'prod.foo']}));
});

test.after(() => {
	sandbox.restore();
});

test.serial('result', async t => {
	t.deepEqual(await db.listTables().exec(), ['test.baz', 'test.foo', 'test.bar', 'prod.foo']);
});

test.serial('filter result on prefix', async t => {
	db['options'].prefix = 'test';

	t.deepEqual(await db.listTables().exec(), ['test.foo', 'test.bar']);

	db['options'].prefix = undefined;
});

test.serial('error if not connected', async t => {
	const original = db.raw;
	db.raw = undefined as any;

	await t.throwsAsync(db.listTables().exec(), 'Call .connect() before executing queries.');

	db.raw = original;
});
