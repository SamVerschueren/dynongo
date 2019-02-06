import test from 'ava';
import * as table from '../../lib/utils/table';
import { DynamoDB } from '../../lib/dynamodb';

test('lookupName', t => {
	t.is(table.lookupName('Bar', {delimiter: '-'} as DynamoDB), 'Bar');
	t.is(table.lookupName('Bar', {prefix: 'Foo', delimiter: '-'} as DynamoDB), 'Foo-Bar');
	t.is(table.lookupName('Bar', {prefix: 'Foo', delimiter: '_'} as DynamoDB), 'Foo_Bar');
});
