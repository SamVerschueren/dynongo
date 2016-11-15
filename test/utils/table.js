import test from 'ava';
import table from '../../lib/utils/table';

test('lookupName', t => {
	t.is(table.lookupName({name: 'Bar'}, {delimiter: '-'}), 'Bar');
	t.is(table.lookupName({name: 'Bar'}, {prefix: 'Foo', delimiter: '-'}), 'Foo-Bar');
	t.is(table.lookupName({name: 'Bar'}, {prefix: 'Foo', delimiter: '_'}), 'Foo_Bar');
});
