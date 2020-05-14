import test from 'ava';
import sinon from 'sinon';
import db from '../..';

db.connect();

const sandbox = sinon.createSandbox();
let transactWriteStub;

test.before(() => {
	transactWriteStub = sandbox.stub(db.raw !, 'transactWriteItems');
	transactWriteStub.returns({
		on: () => {}, // tslint:disable-line:no-empty
		send: (fn) => {
			fn();
		}
	});
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

test('error if number of transaction items is higher than 25', async t => {
	await t.throwsAsync(
		db.transactWrite(
			db.table('foo').insert({id: '1'}, {foo: 'bar'}),
			db.table('foo').insert({id: '2'}, {foo: 'bar'}),
			db.table('foo').insert({id: '3'}, {foo: 'bar'}),
			db.table('foo').insert({id: '4'}, {foo: 'bar'}),
			db.table('foo').insert({id: '5'}, {foo: 'bar'}),
			db.table('foo').insert({id: '6'}, {foo: 'bar'}),
			db.table('foo').insert({id: '7'}, {foo: 'bar'}),
			db.table('foo').insert({id: '8'}, {foo: 'bar'}),
			db.table('foo').insert({id: '9'}, {foo: 'bar'}),
			db.table('foo').insert({id: '10'}, {foo: 'bar'}),
			db.table('foo').insert({id: '11'}, {foo: 'bar'}),
			db.table('foo').insert({id: '12'}, {foo: 'bar'}),
			db.table('foo').insert({id: '13'}, {foo: 'bar'}),
			db.table('foo').insert({id: '14'}, {foo: 'bar'}),
			db.table('foo').insert({id: '15'}, {foo: 'bar'}),
			db.table('foo').insert({id: '16'}, {foo: 'bar'}),
			db.table('foo').insert({id: '17'}, {foo: 'bar'}),
			db.table('foo').insert({id: '18'}, {foo: 'bar'}),
			db.table('foo').insert({id: '19'}, {foo: 'bar'}),
			db.table('foo').insert({id: '20'}, {foo: 'bar'}),
			db.table('foo').insert({id: '21'}, {foo: 'bar'}),
			db.table('foo').insert({id: '22'}, {foo: 'bar'}),
			db.table('foo').insert({id: '23'}, {foo: 'bar'}),
			db.table('foo').insert({id: '24'}, {foo: 'bar'}),
			db.table('foo').insert({id: '25'}, {foo: 'bar'}),
			db.table('foo').insert({id: '26'}, {foo: 'bar'})
		).exec(),
	'Number of transaction items should be less than or equal to `25`, got `26`');
});

test('error if number of transaction items with conditionals is higher than 25', async t => {
	await t.throwsAsync(
		db.transactWrite(
			db.table('foo').insert({id: '1'}, {foo: 'bar'}),
			db.table('foo').insert({id: '2'}, {foo: 'bar'}),
			db.table('foo').insert({id: '3'}, {foo: 'bar'}),
			db.table('foo').insert({id: '4'}, {foo: 'bar'}),
			db.table('foo').insert({id: '5'}, {foo: 'bar'}),
			db.table('foo').insert({id: '6'}, {foo: 'bar'}),
			db.table('foo').insert({id: '7'}, {foo: 'bar'}),
			db.table('foo').insert({id: '8'}, {foo: 'bar'}),
			db.table('foo').insert({id: '9'}, {foo: 'bar'}),
			db.table('foo').insert({id: '10'}, {foo: 'bar'}),
			db.table('foo').insert({id: '11'}, {foo: 'bar'}),
			db.table('foo').insert({id: '12'}, {foo: 'bar'}),
			db.table('foo').insert({id: '13'}, {foo: 'bar'}),
			db.table('foo').insert({id: '14'}, {foo: 'bar'}),
			db.table('foo').insert({id: '15'}, {foo: 'bar'}),
			db.table('foo').insert({id: '16'}, {foo: 'bar'}),
			db.table('foo').insert({id: '17'}, {foo: 'bar'}),
			db.table('foo').insert({id: '18'}, {foo: 'bar'}),
			db.table('foo').insert({id: '19'}, {foo: 'bar'}),
			db.table('foo').insert({id: '20'}, {foo: 'bar'}),
			db.table('foo').insert({id: '21'}, {foo: 'bar'}),
			db.table('foo').insert({id: '22'}, {foo: 'bar'}),
			db.table('foo').insert({id: '23'}, {foo: 'bar'}),
			db.table('foo').insert({id: '24'}, {foo: 'bar'})
		).withConditions(
			db.table('bar').find({id: '1'}).where({foo: 10}),
			db.table('bar').find({id: '2'}).where({foo: 20})
		).exec(),
	'Number of transaction items should be less than or equal to `25`, got `26`');
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
