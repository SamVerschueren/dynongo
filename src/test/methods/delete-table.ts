import test from 'ava';
import * as sinon from 'sinon';
import { DeleteTable } from '../../lib/methods/delete-table';
import db from '../../';

db.connect({prefix: 'foo'});

const Table = db.table('Table');

const sandbox = sinon.sandbox.create();
let deleteTableStub;
let describeTableStub;

test.before(() => {
	deleteTableStub = sandbox.stub(db.raw, 'deleteTable');
	deleteTableStub.yields(undefined, undefined);

	describeTableStub = sinon.stub(db.raw, 'describeTable');
	describeTableStub.onFirstCall().yields(undefined, {Table: {TableStatus: 'ACTIVE'}});
	describeTableStub.yields({name: 'ResourceNotFoundException'});
});

test.after(() => {
	sandbox.restore();
});

test('drop method returns DeleteTable object', t => {
	const query = db.dropTable('Table');

	t.truthy(query instanceof DeleteTable);
	t.is(query['table'].name, 'foo.Table');
});

test.serial('drop', async t => {
	await Table.drop().exec();

	t.deepEqual(deleteTableStub.lastCall.args[0], {TableName: 'foo.Table'});
});

test.serial('drop raw table', async t => {
	await db.dropRawTable('Table').exec();

	t.deepEqual(deleteTableStub.lastCall.args[0], {TableName: 'Table'});
});

test.serial('await', async t => {
	await db.dropTable('Table').wait().exec();

	t.deepEqual(describeTableStub.lastCall.args[0], {TableName: 'foo.Table'});
});

test.serial('error if not connected', async t => {
	const original = db.raw;
	db.raw = undefined;

	await t.throws(Table.drop().exec(), 'Call .connect() before executing queries.');

	db.raw = original;
});
