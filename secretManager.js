const env = require('node-env-file')
env(`${__dirname}/.env`)

// TODO: Look into "rotating secrets".

const secrets = process.env

function getSecretPromise(secretName){
	return new Promise((resolve,reject)=>{
		if (!!secrets[secretName]) {
			resolve(secrets[secretName])
		}else{
			reject('no rights to secret')
		}
	})
}

async function getSecretAsync(secretName){
	try {
		return await getSecretPromise(secretName)
	}catch (error) {
		console.error(error)
	}

	return false
}

module.exports = {
	// getSecretPromise,
	// getSecretAsync,
	getSecret: getSecretAsync,
}
