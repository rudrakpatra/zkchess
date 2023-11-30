export default function ellipsis(
	str: string,
	max = 50,
	collapse: 'start' | 'center' | 'end' = 'center'
) {
	if (str.length <= max) return str;
	switch (collapse) {
		case 'start':
			return `...${str.slice(str.length - max)}`;
		case 'center': {
			const left = Math.ceil((max - 3) / 2);
			const right = Math.floor((max - 3) / 2);
			return `${str.slice(0, left)}...${str.slice(str.length - right)}`;
		}
		case 'end':
		default:
			return `${str.slice(0, max)}...`;
	}
}
