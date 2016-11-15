import test from 'ava';
import sinon from 'sinon';
import CreateTable from '../../lib/methods/create-table';
import db from '../../';
import schema from '../fixtures/schema';

db.connect({prefix: 'foo'});

const Table = db.table('Bar');

test.before(() => {
	sinon.stub(db.dynamodb.service, 'createTable').yields(undefined, undefined);
	const describe = sinon.stub(db.dynamodb.service, 'describeTable');
	describe.onFirstCall().yields(undefined, {Table: {TableStatus: 'CREATING'}});
	describe.yields(undefined, {Table: {TableStatus: 'ACTIVE'}});
});

test.after(() => {
	db.dynamodb.service.createTable.restore();
	db.dynamodb.service.describeTable.restore();
});

test('create method returns CreateTable object', t => {
	const query = db.createTable({TableName: 'Table'});

	t.truthy(query instanceof CreateTable);
	t.is(query._table.name, 'foo.Table');
});

test('throws error if no schema provided', t => {
	t.throws(db.createTable.bind(db), 'Provide a schema object');
	t.throws(Table.create.bind(Table), 'Provide a schema object');
});

test('throws error if no table name is provided', t => {
	t.throws(db.createTable.bind(db, {}), 'The schema is missing a TableName');
});

test.serial('create table', async t => {
	await db.createTable(Object.assign({}, schema)).exec();

	t.deepEqual(db.dynamodb.service.createTable.lastCall.args[0], {
		TableName: 'foo.Table',
		AttributeDefinitions: [
			{
				AttributeName: 'id',
				AttributeType: 'S'
			}
		],
		KeySchema: [
			{
				AttributeName: 'id',
				KeyType: 'HASH'
			}
		],
		ProvisionedThroughput: {
			ReadCapacityUnits: 1,
			WriteCapacityUnits: 1
		}
	});
});

test.serial('create table adjusts the table name', async t => {
	await Table.create(Object.assign({}, schema)).exec();

	t.deepEqual(db.dynamodb.service.createTable.lastCall.args[0], {
		TableName: 'foo.Bar',
		AttributeDefinitions: [
			{
				AttributeName: 'id',
				AttributeType: 'S'
			}
		],
		KeySchema: [
			{
				AttributeName: 'id',
				KeyType: 'HASH'
			}
		],
		ProvisionedThroughput: {
			ReadCapacityUnits: 1,
			WriteCapacityUnits: 1
		}
	});
});

test.serial('await', async t => {
	await db.createTable(Object.create(schema)).wait().exec();

	t.deepEqual(db.dynamodb.service.describeTable.lastCall.args[0], {TableName: 'foo.Table'});
});

test.serial('error if not connected', async t => {
	const original = db.dynamodb;
	db.dynamodb = undefined;

	await t.throws(db.createTable(Object.create(schema)).exec(), 'Call .connect() before executing queries.');

	db.dynamodb = original;
});
