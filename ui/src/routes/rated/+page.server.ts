export async function load({ url }) {
	return {
		challenger: url.searchParams.get('challenger') || undefined,
		playAsBlack: url.searchParams.get('playAsBlack') === 'true',
		// fen: url.searchParams.get('fen')
	};
}
