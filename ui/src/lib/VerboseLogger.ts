const getLogger = (verboseLvl: number) => {
	console.log(`Using Verbose Logger`, 'color:orangered;');
	return (data: any[], lvl: number) => lvl >= verboseLvl && console.log(...data);
};
export default getLogger;
