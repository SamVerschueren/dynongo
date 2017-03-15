export interface UpdateQuery {
	$set?: {[key: string]: any};
	$unset?: {[key: string]: any};
	$inc?: {[key: string]: any};
	$push?: {[key: string]: any};
	$unshift?: {[key: string]: any};
};
