import test from 'ava';
import sinon from 'sinon';
import DeleteTable from '../../lib/methods/delete-table';
import db from '../../';

db.connect({prefix: 'foo'});

const Table = db.table('Table');

test.before(() => {
	sinon.stub(db.dynamodb.service, 'deleteTable').yields(undefined, undefined);
	const describe = sinon.stub(db.dynamodb.service, 'describeTable');
	describe.onFirstCall().yields(undefined, {Table: {TableStatus: 'ACTIVE'}});
	describe.yields({name: 'ResourceNotFoundException'});
});

test.after(() => {
	db.dynamodb.service.deleteTable.restore();
	db.dynamodb.service.describeTable.restore();
});

test('drop method returns DeleteTable object', t => {
	const query = db.dropTable('Table');

	t.truthy(query instanceof DeleteTable);
	t.is(query._table.name, 'foo.Table');
});

test.serial('drop', async t => {
	await Table.drop().exec();

	t.deepEqual(db.dynamodb.service.deleteTable.lastCall.args[0], {TableName: 'foo.Table'});
});

test.serial('await', async t => {
	await db.dropTable('Table').wait().exec();

	t.deepEqual(db.dynamodb.service.describeTable.lastCall.args[0], {TableName: 'foo.Table'});
});

test.serial('error if not connected', async t => {
	const original = db.dynamodb;
	db.dynamodb = undefined;

	await t.throws(Table.drop().exec(), 'Call .connect() before executing queries.');

	db.dynamodb = original;
});
