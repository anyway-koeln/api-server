const { MongoClient } = require("mongodb")
const { getSecret } = require('../secretManager.js')

async function load_incident(incidentID) {
    return new Promise(async (resolve, reject) => {
        const client = new MongoClient(await getSecret('mongodb_url'), { useUnifiedTopology: true })
        
        client.connect()
        .then(() => {
            const database = client.db('cache')
            const collection = database.collection('incidents')

            collection.findOne({ basename: incidentID }, {})
            .then(async (incident) => {
                console.log('incident', incident)
                await client.close()
                resolve(incident)
            })
            .catch(reject)
        })
        .catch(reject)
    })
}

module.exports = (parent, args, context, info) => {	
	return new Promise((resolve,reject)=>{
        load_incident()
        .then(doc => resolve)
        .catch(reject)
	})
}
