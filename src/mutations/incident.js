const { getSecret } = require('../secretManager.js')
const { commit } = require('../git/functions.js')

module.exports = (parent, args, context, info) => {
    const text = args.text

    return new Promise(async (resolve,reject)=>{
        if (text === '') {
            reject('No text.')
        }else{
            commit({
                owner: await getSecret('owner'),
                repo: await getSecret('incident_repo'),
                file_extension: 'json',
                file_content: JSON.stringify({text}),
            })
            .then(resolve)
            .catch(reject)
        }
	})
}

/*
module.exports = async (parent, args, context, info) => {
	return await context.incidentStore.push({ text: args.text })
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

	// return new Promise((resolve,reject)=>{

	// 	resolve(null)
	// })
}
*/