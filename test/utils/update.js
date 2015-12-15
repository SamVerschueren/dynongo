import test from 'ava';
import update from '../../lib/utils/update';

test('$set', t => {
	const result = update.parse({$set: {id: 5, description: 'foo'}});

	t.is(result.UpdateExpression, 'SET #k_id=:v_id, #k_description=:v_description');
	t.same(result.ExpressionAttributeNames, {'#k_id': 'id', '#k_description': 'description'});
	t.same(result.ExpressionAttributeValues, {':v_id': 5, ':v_description': 'foo'});
});

test('$unset', t => {
	const result = update.parse({$unset: {description: true}});

	t.is(result.UpdateExpression, 'REMOVE #k_description');
	t.same(result.ExpressionAttributeNames, {'#k_description': 'description'});
	t.same(result.ExpressionAttributeValues, {});
});

test('$inc', t => {
	const result = update.parse({$inc: {value: 5}});

	t.is(result.UpdateExpression, 'SET #k_value=#k_value+:v_value');
	t.same(result.ExpressionAttributeNames, {'#k_value': 'value'});
	t.same(result.ExpressionAttributeValues, {':v_value': 5});
});

test('$push', t => {
	const result = update.parse({$push: {scores: 85}});

	t.is(result.UpdateExpression, 'SET #k_scores=list_append(#k_scores, :v_scores)');
	t.same(result.ExpressionAttributeNames, {'#k_scores': 'scores'});
	t.same(result.ExpressionAttributeValues, {':v_scores': [85]});
});

test('$push array', t => {
	const result = update.parse({$push: {scores: [85, 94]}});

	t.is(result.UpdateExpression, 'SET #k_scores=list_append(#k_scores, :v_scores)');
	t.same(result.ExpressionAttributeNames, {'#k_scores': 'scores'});
	t.same(result.ExpressionAttributeValues, {':v_scores': [[85, 94]]});
});

test('$push $each in array', t => {
	const result = update.parse({$push: {scores: {$each: [85, 94]}}});

	t.is(result.UpdateExpression, 'SET #k_scores=list_append(#k_scores, :v_scores)');
	t.same(result.ExpressionAttributeNames, {'#k_scores': 'scores'});
	t.same(result.ExpressionAttributeValues, {':v_scores': [85, 94]});
});

test('$push throws error if $each is not an array', t => {
	t.throws(update.parse.bind(update, {$push: {scores: {$each: 85}}}), 'The value for $each should be an array.');
});
