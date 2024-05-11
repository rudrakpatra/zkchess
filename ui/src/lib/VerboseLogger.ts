const getLogger = (verboseLvl: number) => {
	console.log(
		'%c[verbose]\n\n',
		'color:#a63; text-decoration: underline;',
		'using verbose level',
		verboseLvl
	);
	return (data: any[], lvl: number) =>
		lvl <= verboseLvl &&
		console.log('%c[verbose]\n\n', 'color:#a63; text-decoration: underline;', ...data);
};
export default getLogger;
