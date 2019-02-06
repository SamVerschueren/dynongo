export default (data?: any) => {
	return {
		promise() {
			if (data instanceof Error) {
				return Promise.reject(data);
			}

			return Promise.resolve(data);
		}
	};
};
