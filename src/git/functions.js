const { Octokit } = require('@octokit/core')
const { getSecret } = require('../secretManager')
const { v4: uuidv4 } = require('uuid')

function create_branch_from_template(owner, repo) {
    return new Promise(async (resolve, reject) => {
        if (!(!!owner)) {
            reject(new Error('Please provide an owner.'))
        }
        if (!(!!repo)) {
            reject(new Error('Please provide a repo.'))
        }
        
        const octokit = new Octokit({ auth: await getSecret('token') })

        const newDataID = uuidv4()
        const new_branch_name = `data-${newDataID}`

        octokit.request('GET /repos/{owner}/{repo}/branches/{branch}', {
            owner,
            repo,
            branch: 'template',
        })
        .then(template_branch_infos => {
            const template_branch_sha = template_branch_infos.data.commit.sha
            
            octokit.request('POST /repos/{owner}/{repo}/git/refs', {
                owner,
                repo,
                ref: `refs/heads/${new_branch_name}`,
                sha: template_branch_sha,
            })
            .then(response => {
                resolve({
                    id: newDataID,
                    name: new_branch_name,
                })
            })
            .catch(error => {
                console.log('error', error)
                // if (error.status === 422) { // HttpError: Reference already exists
                //     create_branch_from_template(owner, repo)
                //     .then(resolve)
                //     .catch(reject)
                // } else {
                    reject(error)
                // }
            })
        })
        .catch(reject)
    })
}

function commit({ owner, repo, file_extension, file_content }) {
    return new Promise(async (resolve, reject) => {
        if (!(!!owner)) {
            reject(new Error('Please provide an owner.'))
        }
        if (!(!!repo)) {
            reject(new Error('Please provide a repo.'))
        }

        const octokit = new Octokit({ auth: await getSecret('token') })

        create_branch_from_template(owner, repo)
        .then(new_branch_infos => {            
            octokit.request('PUT /repos/{owner}/{repo}/contents/{path}', {
                owner,
                repo,
                path: `data/${new_branch_infos.id}.${file_extension || 'text'}`,
                branch: new_branch_infos.name,
                message: 'Some message…',
                content: Buffer.from(file_content).toString('base64'),
            })
            .then(response => {
                octokit.request('POST /repos/{owner}/{repo}/pulls', {
                    owner,
                    repo,
                    head: new_branch_infos.name,
                    base: 'data',
                    title: `Merge data from ${new_branch_infos.name}`,
                    body: 'Some description…',
                })
                .then(response => {
                    resolve(new_branch_infos.id)
                })
                .catch(reject)
            })
            .catch(reject)
        })
        .catch(reject)
    })
}

function load_data_tree({owner, repo}) {
    return new Promise(async (resolve, reject) => {
        if (!(!!owner)) {
            reject(new Error('Please provide an owner.'))
        }
        if (!(!!repo)) {
            reject(new Error('Please provide a repo.'))
        }

        const octokit = new Octokit({ auth: await getSecret('token') })

        octokit.request('GET /repos/{owner}/{repo}/contents/{path}?ref={ref}', {
            owner,
            repo,
            path: '',
            ref: 'data',
        })
        .then(data_branch_tree_response => {
            const files = data_branch_tree_response.data
            .filter(file => file.path === 'data')
            .map(file => file.sha)

            const data_tree_sha = files[0]

            if (!(!!data_tree_sha)) {
                reject(new Error('Could not get data-tree sha.'))
            } else {
                octokit.request('GET /repos/{owner}/{repo}/git/trees/{tree_sha}', {
                    owner,
                    repo,
                    tree_sha: data_tree_sha,
                })
                .then(data_tree_response => {
                    resolve(
                        data_tree_response.data.tree
                        .filter(file => file.path !== '.gitkeep')
                    )
                })
                .catch(reject)
            }
        })
        .catch(reject)
    })
}

module.exports = {
    create_branch_from_template,
    commit,
    load_data_tree,
}
