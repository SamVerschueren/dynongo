import test from 'ava';
import sinon from 'sinon';
import { DeleteTable } from '../../lib/methods/delete-table';
import stubPromise from '../fixtures/stub-promise';
import db from '../..';

db.connect({prefix: 'foo'});

const Table = db.table('Table');

const sandbox = sinon.createSandbox();
let deleteTableStub;
let describeTableStub;

const resourceNotFound = new Error('ResourceNotFoundException');
resourceNotFound.name = 'ResourceNotFoundException';

test.before(() => {
	deleteTableStub = sandbox.stub(db.raw !, 'deleteTable');
	deleteTableStub.returns(stubPromise());

	describeTableStub = sandbox.stub(db.raw !, 'describeTable');
	describeTableStub.onFirstCall().returns(stubPromise({Table: {TableStatus: 'ACTIVE'}}));
	describeTableStub.returns(stubPromise(resourceNotFound));
});

test.after(() => {
	sandbox.restore();
});

test('drop method returns DeleteTable object', t => {
	const query = db.dropTable('Table');

	t.truthy(query instanceof DeleteTable);
	t.is((query['table'] !).name, 'foo.Table');
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
	db.raw = undefined as any;

	await t.throwsAsync(Table.drop().exec(), 'Call .connect() before executing queries.');

	db.raw = original;
});
