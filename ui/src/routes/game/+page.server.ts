export async function load({ url }) {
	return {
		challenger: url.searchParams.get('challenger') || undefined
		// fen: url.searchParams.get('fen')
	};
}
