export default function ellipsis(str: string, max = 50) {
	if (str.length <= max) {
		return str;
	}
	return `${str.slice(0, max)}...`;
}
