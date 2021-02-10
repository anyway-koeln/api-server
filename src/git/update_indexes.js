const { getSecret } = require('../secretManager.js')
const { load_data_tree } = require('./functions.js')

function self_update () {
    return new Promise(async (resolve, reject) => {
        load_data_tree({
            owner: await getSecret('owner'),
            repo: await getSecret('incident_repo'),
        })
        .then(resolve)
        .catch(reject)
    })
}

module.exports = self_update
