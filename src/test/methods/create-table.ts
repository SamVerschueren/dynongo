import path from 'path';
import test from 'ava';
import sinon from 'sinon';
import { sync } from 'load-json-file';
import { CreateTable } from '../../lib/methods/create-table';
import { Schema } from '../../lib/types/schema';
import stubPromise from '../fixtures/stub-promise';
import db from '../..';

db.connect({prefix: 'foo'});

const schema = sync<Schema>(path.join(__dirname, '../fixtures/schema.json'));

const Table = db.table('Bar');

const sandbox = sinon.createSandbox();
let createTableStub;
let describeTableStub;

test.before(() => {
	createTableStub = sandbox.stub(db.raw !, 'createTable');
	createTableStub.returns(stubPromise());

	describeTableStub = sandbox.stub(db.raw !, 'describeTable');
	describeTableStub.onFirstCall().returns(stubPromise({Table: {TableStatus: 'CREATING'}}));
	describeTableStub.returns(stubPromise({Table: {TableStatus: 'ACTIVE'}}));
});

test.after(() => {
	sandbox.restore();
});

test('create method returns CreateTable object', t => {
	const query = db.createTable({TableName: 'Table'} as any);

	t.truthy(query instanceof CreateTable);
	t.is((query['table'] !).name, 'foo.Table');
});

test('throws error if no schema provided', t => {
	t.throws(() => db.createTable(undefined as any), 'Expected `schema` to be of type `object`, got `undefined`');
	t.throws(() => Table.create(undefined as any), 'Expected `schema` to be of type `object`, got `undefined`');
});

test('throws error if no table name is provided', t => {
	t.throws(() => db.createTable({} as any), 'Schema is missing a `TableName`');
});

test.serial('create table', async t => {
	await db.createTable({...schema}).exec();

	t.deepEqual(createTableStub.lastCall.args[0], {
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
	await Table.create({...schema}).exec();

	t.deepEqual(createTableStub.lastCall.args[0], {
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

test.serial('create raw table', async t => {
	await db.createRawTable({...schema}).exec();

	t.deepEqual(createTableStub.lastCall.args[0], {
		TableName: 'Table',
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
	await db.createTable({...schema}).wait().exec();

	t.deepEqual(describeTableStub.lastCall.args[0], {TableName: 'foo.Table'});
});

test.serial('error if not connected', async t => {
	const original = db.raw;
	db.raw = undefined as any;

	await t.throwsAsync(db.createTable({...schema}).exec(), 'Call .connect() before executing queries.');

	db.raw = original;
});
