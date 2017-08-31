import * as AWS from 'aws-sdk';
import * as pick from 'object.pick';
import { Table, TableOptions } from './table';
import { ListTables } from './methods/list-tables';
import { Schema } from './types/schema';
import { DeleteTable } from './methods/delete-table';
import { CreateTable } from './methods/create-table';

export interface Options {
	local?: boolean;
	host?: string;
	localPort?: number;
	prefix?: string;
	prefixDelimiter?: string;
	region?: string;
	accessKeyId?: string;
	secretAccessKey?: string;
}

export class DynamoDB {

	public raw: AWS.DynamoDB;
	public dynamodb: AWS.DynamoDB.DocumentClient;
	private options: Options;

	connect(options?: Options) {
		this.options = Object.assign({
			prefix: '',
			prefixDelimiter: '.',
			host: 'localhost',
			localPort: 8000
		}, options);

		AWS.config.update(pick(this.options, ['region', 'accessKeyId', 'secretAccessKey']));

		if (this.options.local) {
			// Starts dynamodb in local mode
			this.raw = new AWS.DynamoDB({
				endpoint: `http://${this.options.host}:${this.options.localPort}`
			});
		} else {
			// Starts dynamodb in remote mode
			this.raw = new AWS.DynamoDB();
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
}
