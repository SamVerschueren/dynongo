export interface UpdateQuery {
	$set?: { [key: string]: { $ifNotExists: any } | any };
	$unset?: { [key: string]: any };
	$inc?: { [key: string]: any };
	$push?: { [key: string]: any };
	$unshift?: { [key: string]: any };
	$addToSet?: { [key: string]: any };
	$removeFromSet?: { [key: string]: any };
}
