import AWS from 'aws-sdk';
import pick from 'object.pick';
import { Options as RetryOptions } from 'p-retry';
import { Table, TableOptions } from './table';
import {
	ListTables,
	DeleteTable,
	CreateTable,
	TransactWrite,
	WriteItem,
	TransactRead,
	ReadItem, BatchWrite
} from './methods';
import { Schema } from './types';
import { configureRetryOptions } from './utils';
import { BatchItem } from './methods/batch';

export interface DynamoDBOptions {
	local?: boolean;
	host?: string;
	localPort?: number;
	prefix?: string;
	prefixDelimiter?: string;
	region?: string;
	accessKeyId?: string;
	secretAccessKey?: string;
	sessionToken?: string;
	retries?: number | RetryOptions;
	httpOptions?: AWS.HTTPOptions;
	maxRetries?: number;
	retryDelayOptions?: {
		base?: number,
		customBackoff?(retryCount: number, err: Error): number
	};
}

export class DynamoDB {

	public raw?: AWS.DynamoDB;
	public dynamodb?: AWS.DynamoDB.DocumentClient;
	private options: DynamoDBOptions = {};
	private _retries?: number | RetryOptions;

	connect(options?: DynamoDBOptions) {
		this.options = {
			prefix: '',
			prefixDelimiter: '.',
			host: 'localhost',
			localPort: 8000,
			...options
		};

		this._retries = configureRetryOptions(this.options.retries);

		AWS.config.update(pick(this.options, [
			'region',
			'accessKeyId',
			'secretAccessKey',
			'sessionToken',
			'maxRetries',
			'retryDelayOptions'
		]));

		if (this.options.local) {
			// Starts dynamodb in local mode
			this.raw = new AWS.DynamoDB({
				endpoint: `http://${this.options.host}:${this.options.localPort}`,
				httpOptions: this.options.httpOptions
			});
		} else {
			// Starts dynamodb in remote mode
			this.raw = new AWS.DynamoDB({
				httpOptions: this.options.httpOptions
			});
		}

		this.dynamodb = new AWS.DynamoDB.DocumentClient({
			service: this.raw
		});
	}

	get delimiter() {
		return this.options.prefixDelimiter;
	}

	get prefix() {
		return this.options.prefix;
	}

	get retries() {
		return this._retries;
	}

	/**
	 * Returns the table that can be used to interact with it.
	 *
	 * @param  name		The name of the table that is being interacted with.
	 * @param  options	Options object.
	 */
	table(name: string, options?: TableOptions) {
		return new Table(name, this, options);
	}

	/**
	 * Returns the table that can be used to interact with. The table name will not be prefixed automatically.
	 *
	 * @param  name		The name of the table that is being interacted with.
	 */
	rawTable(name: string) {
		return new Table(name, this, {raw: true});
	}

	/**
	 * Instantiate a dropped table object.
	 *
	 * @param	name		The name of the table that should be dropped.
	 * @param	options		Options object.
	 */
	dropTable(name: string, options?: TableOptions): DeleteTable {
		return this.table(name, options).drop();
	}

	/**
	 * Instantiate a raw dropped table object. The table name will not be prefixed automatically.
	 *
	 * @param	name		The name of the table that should be dropped.
	 */
	dropRawTable(name: string): DeleteTable {
		return this.dropTable(name, {raw: true});
	}

	/**
	 * Instantiate a create table object.
	 *
	 * @param	schema		The schema of the table that should be created.
	 * @param	options		Options object.
	 */
	createTable(schema: Schema, options?: TableOptions): CreateTable {
		if (typeof schema !== 'object') {
			throw new TypeError(`Expected \`schema\` to be of type \`object\`, got \`${typeof schema}\``);
		}

		if (!schema.TableName) {
			throw new Error('Schema is missing a `TableName`');
		}

		return this.table(schema.TableName, options).create(schema);
	}

	/**
	 * Instantiate a create table object.
	 *
	 * @param	schema		The schema of the table that should be created.
	 */
	createRawTable(schema: Schema): CreateTable {
		return this.createTable(schema, {raw: true});
	}

	/**
	 * Instantiate a list tables object.
	 */
	listTables() {
		return new ListTables(this);
	}

	/**
	 * Start a write transaction with the provided actions.
	 *
	 * @param	actions		List of transaction actions.
	 */
	transactWrite(...actions: WriteItem[]) {
		return new TransactWrite(this, actions);
	}

	/**
	 * Start a read transaction with the provided actions.
	 *
	 * @param	actions		List of transaction actions.
	 */
	transactRead(...actions: ReadItem[]) {
		return new TransactRead(this, actions);
	}

	batchWrite(...items: BatchItem[]) {
		return new BatchWrite(this, items);
	}
}
