import { DynamoDB } from './lib';

export {
	ReadItem,
	TransactRead,
	TransactQuery,
	TransactDeleteItem,
	TransactInsertItem,
	TransactUpdateItem,
	WriteItem,
	BatchWrite,
	TransactWrite,
	TransactMethod,
	BaseQuery,
	CreateTable,
	DeleteItem,
	DeleteTable,
	Executable,
	InsertItem,
	ListTables,
	Method,
	Query,
	Scan,
	UpdateItem,
	UpdateQuery,
	DynamoDBOptions,
	DynamoDB,
	TableOptions,
	Table
} from './lib';

export default new DynamoDB();
