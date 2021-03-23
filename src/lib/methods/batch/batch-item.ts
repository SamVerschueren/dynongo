export abstract class BatchItem {

	protected constructor(public table: string, public key: any) {
	}

	abstract get value();
}
