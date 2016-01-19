import test from 'ava';
import table from '../../lib/utils/table';

test('lookupName', t => {
	t.is(table.lookupName('Bar', {_delimiter: '-'}), 'Bar');
	t.is(table.lookupName('Bar', {_prefix: 'Foo', _delimiter: '-'}), 'Foo-Bar');
	t.is(table.lookupName('Bar', {_prefix: 'Foo', _delimiter: '_'}), 'Foo_Bar');
});
