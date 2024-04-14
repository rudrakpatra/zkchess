export async function load({ url }) {
	return {
		key: url.searchParams.get('key') || undefined,
	};
}
