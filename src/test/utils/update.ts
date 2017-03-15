import test from 'ava';
import * as update from '../../lib/utils/update';

test('$set', t => {
	const result = update.parse({$set: {id: 5, description: 'foo'}});

	t.is(result.UpdateExpression, 'SET #k_id=:v_id, #k_description=:v_description');
	t.deepEqual(result.ExpressionAttributeNames, {'#k_id': 'id', '#k_description': 'description'});
	t.deepEqual(result.ExpressionAttributeValues, {':v_id': 5, ':v_description': 'foo'});
});

test('$unset', t => {
	const result = update.parse({$unset: {description: true}});

	t.is(result.UpdateExpression, 'REMOVE #k_description');
	t.deepEqual(result.ExpressionAttributeNames, {'#k_description': 'description'});
	t.deepEqual(result.ExpressionAttributeValues, {});
});

test('$inc', t => {
	const result = update.parse({$inc: {value: 5}});

	t.is(result.UpdateExpression, 'SET #k_value=#k_value+:v_value');
	t.deepEqual(result.ExpressionAttributeNames, {'#k_value': 'value'});
	t.deepEqual(result.ExpressionAttributeValues, {':v_value': 5});
});

test('$push', t => {
	const result = update.parse({$push: {scores: 85}});

	t.is(result.UpdateExpression, 'SET #k_scores=list_append(if_not_exists(#k_scores, :_v_empty_list), :v_scores)');
	t.deepEqual(result.ExpressionAttributeNames, {'#k_scores': 'scores'});
	t.deepEqual(result.ExpressionAttributeValues, {':v_scores': [85], ':_v_empty_list': []});
});

test('$unshift', t => {
	const result = update.parse({$unshift: {scores: 85}});

	t.is(result.UpdateExpression, 'SET #k_scores=list_append(:v_scores, if_not_exists(#k_scores, :_v_empty_list))');
	t.deepEqual(result.ExpressionAttributeNames, {'#k_scores': 'scores'});
	t.deepEqual(result.ExpressionAttributeValues, {':v_scores': [85], ':_v_empty_list': []});
});

test('$push array', t => {
	const result = update.parse({$push: {scores: [85, 94]}});

	t.is(result.UpdateExpression, 'SET #k_scores=list_append(if_not_exists(#k_scores, :_v_empty_list), :v_scores)');
	t.deepEqual(result.ExpressionAttributeNames, {'#k_scores': 'scores'});
	t.deepEqual(result.ExpressionAttributeValues, {':v_scores': [[85, 94]], ':_v_empty_list': []});
});

test('$unshift array', t => {
	const result = update.parse({$unshift: {scores: [85, 94]}});

	t.is(result.UpdateExpression, 'SET #k_scores=list_append(:v_scores, if_not_exists(#k_scores, :_v_empty_list))');
	t.deepEqual(result.ExpressionAttributeNames, {'#k_scores': 'scores'});
	t.deepEqual(result.ExpressionAttributeValues, {':v_scores': [[85, 94]], ':_v_empty_list': []});
});

test('$push $each in array', t => {
	const result = update.parse({$push: {scores: {$each: [85, 94]}}});

	t.is(result.UpdateExpression, 'SET #k_scores=list_append(if_not_exists(#k_scores, :_v_empty_list), :v_scores)');
	t.deepEqual(result.ExpressionAttributeNames, {'#k_scores': 'scores'});
	t.deepEqual(result.ExpressionAttributeValues, {':v_scores': [85, 94], ':_v_empty_list': []});
});

test('$unshift $each in array', t => {
	const result = update.parse({$unshift: {scores: {$each: [85, 94]}}});

	t.is(result.UpdateExpression, 'SET #k_scores=list_append(:v_scores, if_not_exists(#k_scores, :_v_empty_list))');
	t.deepEqual(result.ExpressionAttributeNames, {'#k_scores': 'scores'});
	t.deepEqual(result.ExpressionAttributeValues, {':v_scores': [85, 94], ':_v_empty_list': []});
});

test('$push throws error if $each is not an array', t => {
	t.throws(update.parse.bind(update, {$push: {scores: {$each: 85}}}), 'The value for $each should be an array.');
});

test('$unshift throws error if $each is not an array', t => {
	t.throws(update.parse.bind(update, {$unshift: {scores: {$each: 85}}}), 'The value for $each should be an array.');
});
