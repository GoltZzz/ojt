export default (func) => {
	return (req, res, next) => {
		console.log(`⏳ Running async function: ${func.name}`);
		func(req, res, next)
			.then(() => console.log(`✅ Finished async function: ${func.name}`))
			.catch((err) => {
				console.error(`❌ Error in async function: ${func.name}`, err);
				next(err);
			});
	};
};
