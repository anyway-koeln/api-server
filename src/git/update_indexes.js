const { Octokit } = require('@octokit/core')
const { getSecret } = require('../secretManager.js')
const { load_data_tree } = require('./functions.js')
const async = require('async')
const matter = require('gray-matter')

function annotate_file(file, callback) {
    if (file.path.endsWith('.md')) {
        const data = matter(file.content_raw)
        file.content_markdown = data.content
        file.content_attributes = data.data
        callback(file)
    } else {
        callback(null)
    }
}

async function load_content(owner, repo, file_sha) {
    const octokit = new Octokit({ auth: await getSecret('token') })

    const response = await octokit.request('GET /repos/{owner}/{repo}/git/blobs/{file_sha}', {
        owner,
        repo,
        file_sha,
    })
    return response
}

function add_to_db(owner, repo, file, callback) {
    if (true) { // TODO: if file.path does not exist with file.sha 
        load_content(owner, repo, file.sha)
        .then(response => {
            annotate_file({
                path: file.path,
                sha: file.sha,
                mode: file.mode,
                type: file.type,
                size: file.size,
                content_raw: Buffer.from(response.data.content, 'base64').toString('utf-8'),
            }, file => {
                console.log('file', file)
                callback()
            })
        })
        .catch(callback)
    } else {
        callback()
    }
}

function self_update () {
    return new Promise(async (resolve, reject) => {
        const owner = await getSecret('owner')
        const repo = await getSecret('incident_repo')

        load_data_tree({ owner, repo })
        .then(tree => {
            async.each([tree[0]], (file, callback) => {
                add_to_db(owner, repo, file, callback)
            }, error => {
                if (error) {
                    console.log('A file failed to process')
                } else {
                    console.log('All files have been processed successfully')
                }

                resolve(true)
            })
        })
        .catch(reject)
    })
}

module.exports = self_update
