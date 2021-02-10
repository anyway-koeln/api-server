const { Octokit } = require('@octokit/core')
const { getSecret } = require('../secretManager.js')
const { load_data_tree } = require('./functions.js')

function annotate(file){
    if (file.path.endsWith('.json')) {
        file.content_json = JSON.parse(file.content_raw) || null
    }
    return file
}

function self_update () {
    return new Promise(async (resolve, reject) => {
        const owner = await getSecret('owner')
        const repo = await getSecret('incident_repo')

        const octokit = new Octokit({ auth: await getSecret('token') })

        load_data_tree({
            owner,
            repo,
        })
        .then(tree => {
            Promise.all(
                tree
                .filter(file => true)
                .map(async file => {
                    const response = await octokit.request('GET /repos/{owner}/{repo}/git/blobs/{file_sha}', {
                        owner,
                        repo,
                        file_sha: file.sha,
                    })

                    return annotate({
                        path: file.path,
                        sha: file.sha,
                        mode: file.mode,
                        type: file.type,
                        size: file.size,
                        content_raw: Buffer.from(response.data.content, 'base64').toString('utf-8'),
                    })
                })
            )
            .then(tree => {
                console.log(tree)
            })

            resolve(true)
        })
        .catch(reject)
    })
}

module.exports = self_update
