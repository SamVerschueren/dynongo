import test from 'ava';
import sinon from 'sinon';
import stubPromise from '../fixtures/stub-promise';
import db from '../..';

db.connect();

const sandbox = sinon.createSandbox();
let transactWriteStub;

test.before(() => {
	transactWriteStub = sandbox.stub(db.raw !, 'transactWriteItems');
	transactWriteStub.returns(stubPromise({Attributes: 'foo'}));
});

test.after(() => {
	sandbox.restore();
});

test('error if action is not supported', async t => {
	await t.throwsAsync(
		db.transactWrite(
			db.table('foo')
				.find() as any
		).exec(),
	'Unknown TransactWrite action provided');
});

test('error if number of transaction items is higher than 10', async t => {
	await t.throwsAsync(
		db.transactWrite(
			db.table('foo') .insert({id: '1'}, {foo: 'bar'}),
			db.table('foo') .insert({id: '2'}, {foo: 'bar'}),
			db.table('foo') .insert({id: '3'}, {foo: 'bar'}),
			db.table('foo') .insert({id: '4'}, {foo: 'bar'}),
			db.table('foo') .insert({id: '5'}, {foo: 'bar'}),
			db.table('foo') .insert({id: '6'}, {foo: 'bar'}),
			db.table('foo') .insert({id: '7'}, {foo: 'bar'}),
			db.table('foo') .insert({id: '8'}, {foo: 'bar'}),
			db.table('foo') .insert({id: '9'}, {foo: 'bar'}),
			db.table('foo') .insert({id: '10'}, {foo: 'bar'}),
			db.table('foo') .insert({id: '11'}, {foo: 'bar'})
		).exec(),
	'Number of transaction items should be less than or equal to `10`, got `11`');
});

test('error if number of transaction items with conditionals is higher than 10', async t => {
	await t.throwsAsync(
		db.transactWrite(
			db.table('foo') .insert({id: '1'}, {foo: 'bar'}),
			db.table('foo') .insert({id: '2'}, {foo: 'bar'}),
			db.table('foo') .insert({id: '3'}, {foo: 'bar'}),
			db.table('foo') .insert({id: '4'}, {foo: 'bar'}),
			db.table('foo') .insert({id: '5'}, {foo: 'bar'}),
			db.table('foo') .insert({id: '6'}, {foo: 'bar'}),
			db.table('foo') .insert({id: '7'}, {foo: 'bar'}),
			db.table('foo') .insert({id: '8'}, {foo: 'bar'}),
			db.table('foo') .insert({id: '9'}, {foo: 'bar'})
		).withConditions(
			db.table('bar').find({id: '1'}).where({foo: 10}),
			db.table('bar').find({id: '2'}).where({foo: 20})
		).exec(),
	'Number of transaction items should be less than or equal to `10`, got `11`');
});

test('error if condition does not have a where clause', async t => {
	await t.throwsAsync(
		db.transactWrite(
			db.table('foo').insert({id: '5'}, {foo: 'bar'})
		).withConditions(
			db.table('bar').find({id: '5'})
		).exec(),
	'No `where` clause provided in transaction ConditionCheck');
});

test.serial('execute transactions', async t => {
	await db.transactWrite(
		db.table('foo')
			.insert({id: '5'}, {foo: 'bar'}),
		db.table('unicorn')
			.update({id: '6'}, {$set: {unicorn: 'rainbow'}}),
		db.table('rocket')
			.remove({id: '10'})
	).exec();

	t.deepEqual(transactWriteStub.lastCall.args[0], {
		TransactItems: [
			{
				Update: {
					TableName: 'foo',
					Key: {
						id: {
							S: '5'
						}
					},
					ConditionExpression: 'NOT (#k_id=:v_id)',
					UpdateExpression: 'SET #k_foo=:v_foo',
					ExpressionAttributeNames: {
						'#k_foo': 'foo',
						'#k_id': 'id'
					},
					ExpressionAttributeValues: {
						':v_foo': {
							S: 'bar'
						},
						':v_id': {
							S: '5'
						}
					}
				}
			},
			{
				Update: {
					TableName: 'unicorn',
					Key: {
						id: {
							S: '6'
						}
					},
					ConditionExpression: '#k_id=:v_id',
					UpdateExpression: 'SET #k_unicorn=:v_unicorn',
					ExpressionAttributeNames: {
						'#k_unicorn': 'unicorn',
						'#k_id': 'id'
					},
					ExpressionAttributeValues: {
						':v_unicorn': {
							S: 'rainbow'
						},
						':v_id': {
							S: '6'
						}
					}
				}
			},
			{
				Delete: {
					TableName: 'rocket',
					Key: {
						id: {
							S: '10'
						}
					},
					ConditionExpression: undefined,
					ExpressionAttributeNames: undefined,
					ExpressionAttributeValues: undefined
				}
			}
		]
	});
});

test.serial('execute transactions with conditionals', async t => {
	await db.transactWrite(
		db.table('foo')
			.insert({id: '5'}, {foo: 'bar'})
	).withConditions(
		db.table('bar')
			.find({id: '5'})
			.where({value: 10})
	).exec();

	t.deepEqual(transactWriteStub.lastCall.args[0], {
		TransactItems: [
			{
				ConditionCheck: {
					TableName: 'bar',
					Key: {
						id: {
							S: '5'
						}
					},
					ConditionExpression: '#k_value=:v_value',
					ExpressionAttributeNames: {
						'#k_value': 'value'
					},
					ExpressionAttributeValues: {
						':v_value': {
							N: '10'
						}
					}
				}
			},
			{
				Update: {
					TableName: 'foo',
					Key: {
						id: {
							S: '5'
						}
					},
					ConditionExpression: 'NOT (#k_id=:v_id)',
					UpdateExpression: 'SET #k_foo=:v_foo',
					ExpressionAttributeNames: {
						'#k_foo': 'foo',
						'#k_id': 'id'
					},
					ExpressionAttributeValues: {
						':v_foo': {
							S: 'bar'
						},
						':v_id': {
							S: '5'
						}
					}
				}
			}
		]
	});
});
