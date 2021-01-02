module.exports = async (parent, args, context, info) => {
	
	console.log('test-secret:', await context.getSecret('test') )
	return new Promise((resolve,reject)=>{
		resolve(null)
	})
}