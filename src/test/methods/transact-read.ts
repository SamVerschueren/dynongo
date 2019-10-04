import test from 'ava';
import sinon from 'sinon';
import stubPromise from '../fixtures/stub-promise';
import db from '../..';

db.connect();

const sandbox = sinon.createSandbox();
let transactReadStub;

test.before(() => {
	transactReadStub = sandbox.stub(db.raw !, 'transactGetItems');
	transactReadStub.returns(stubPromise({Responses: [{Item: {foo: {S: 'bar'}}}]}));
});

test.after(() => {
	sandbox.restore();
});

test('error if action is not supported', async t => {
	await t.throwsAsync(
		db.transactRead(
			db.table('foo')
				.insert({foo: 'foo'}) as any
		).exec(),
	'Unknown TransactRead action provided');
});

test('error if where clause is provided', async t => {
	await t.throwsAsync(
		db.transactRead(
			db.table('foo')
				.find({id: '1'})
				.where({value: {$gte: 10}})
		).exec(),
	'Can not use a where clause in a read transaction');
});

test('error if another index is used', async t => {
	await t.throwsAsync(
		db.transactRead(
			db.table('foo')
				.find({id: '1'}, 'GSI2')
		).exec(),
	'Can not use a Global Secondary Index in a read transaction');
});

test('error if number of transaction items is higher than 25', async t => {
	await t.throwsAsync(
		db.transactRead(
			db.table('foo').find({id: '1'}),
			db.table('foo').find({id: '2'}),
			db.table('foo').find({id: '3'}),
			db.table('foo').find({id: '4'}),
			db.table('foo').find({id: '5'}),
			db.table('foo').find({id: '6'}),
			db.table('foo').find({id: '7'}),
			db.table('foo').find({id: '8'}),
			db.table('foo').find({id: '9'}),
			db.table('foo').find({id: '10'}),
			db.table('foo').find({id: '11'}),
			db.table('foo').find({id: '12'}),
			db.table('foo').find({id: '13'}),
			db.table('foo').find({id: '14'}),
			db.table('foo').find({id: '15'}),
			db.table('foo').find({id: '16'}),
			db.table('foo').find({id: '17'}),
			db.table('foo').find({id: '18'}),
			db.table('foo').find({id: '19'}),
			db.table('foo').find({id: '20'}),
			db.table('foo').find({id: '21'}),
			db.table('foo').find({id: '22'}),
			db.table('foo').find({id: '23'}),
			db.table('foo').find({id: '24'}),
			db.table('foo').find({id: '25'}),
			db.table('foo').find({id: '26'})
		).exec(),
	'Number of transaction items should be less than or equal to `25`, got `26`');
});

test.serial('execute transactions', async t => {
	const result = await db.transactRead(
		db.table('foo')
			.find({id: '5'})
			.select('foo')
	).exec();

	t.deepEqual(result, [
		{foo: 'bar'}
	]);

	t.deepEqual(transactReadStub.lastCall.args[0], {
		TransactItems: [
			{
				Get: {
					TableName: 'foo',
					Key: {
						id: {
							S: '5'
						}
					},
					ProjectionExpression: '#k_foo',
					ExpressionAttributeNames: {
						'#k_foo': 'foo'
					}
				}
			}
		]
	});
});
