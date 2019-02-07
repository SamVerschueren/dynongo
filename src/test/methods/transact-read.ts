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

test('error if number of transaction items is higher than 10', async t => {
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
			db.table('foo').find({id: '12'})
		).exec(),
	'Number of transaction items should be less than or equal to `10`, got `12`');
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
