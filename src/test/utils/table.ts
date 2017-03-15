import test from 'ava';
import * as table from '../../lib/utils/table';

test('lookupName', t => {
	t.is(table.lookupName('Bar', {delimiter: '-'}), 'Bar');
	t.is(table.lookupName('Bar', {prefix: 'Foo', delimiter: '-'}), 'Foo-Bar');
	t.is(table.lookupName('Bar', {prefix: 'Foo', delimiter: '_'}), 'Foo_Bar');
});
