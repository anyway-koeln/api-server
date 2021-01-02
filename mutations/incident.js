module.exports = async (parent, args, context, info) => {
	
	console.log('test-secret:', await context.getSecret('test') )

	// args.text

	// git clone -b TEMPLATE https://github.com/thomasrosen/empty.git;
	// cd ./empty/objects/;
	// git checkout -b test TEMPLATE;
	// touch test_2.yml;
	// git add .;
	// git commit -m "test 2";
	// git push --set-upstream origin test;
	// cd ../../;
	// rm -Rf empty

	return new Promise((resolve,reject)=>{
		resolve(null)
	})
}
