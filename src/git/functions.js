const { Octokit } = require('@octokit/core')
const { getSecret } = require('../secretManager')
const { v4: uuidv4 } = require('uuid')

function createBranchFromTemplate (owner, repo) {
  return new Promise(async (resolve, reject) => {
    if (!owner) {
      reject(new Error('Please provide an owner.'))
    }
    if (!repo) {
      reject(new Error('Please provide a repo.'))
    }

    const octokit = new Octokit({ auth: await getSecret('token') })

    const newDataID = uuidv4()
    const newBranchName = `data-${newDataID}`

    octokit.request('GET /repos/{owner}/{repo}/branches/{branch}', {
      owner,
      repo,
      branch: 'template'
    })
      .then(templateBranchInfos => {
        const templateBranchSHA = templateBranchInfos.data.commit.sha

        octokit.request('POST /repos/{owner}/{repo}/git/refs', {
          owner,
          repo,
          ref: `refs/heads/${newBranchName}`,
          sha: templateBranchSHA
        }).then(response => {
          resolve({
            id: newDataID,
            name: newBranchName
          })
        })
          .catch(error => {
            console.log('error', error)
            // if (error.status === 422) { // HttpError: Reference already exists
            //     createBranchFromTemplate(owner, repo)
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

function commit ({ owner, repo, filteExtension, fileContent }) {
  return new Promise(async (resolve, reject) => {
    if (!owner) {
      reject(new Error('Please provide an owner.'))
    }
    if (!repo) {
      reject(new Error('Please provide a repo.'))
    }

    const octokit = new Octokit({ auth: await getSecret('token') })

    createBranchFromTemplate(owner, repo)
      .then(newBranchInfos => {
        octokit.request('PUT /repos/{owner}/{repo}/contents/{path}', {
          owner,
          repo,
          path: `data/${newBranchInfos.id}.${filteExtension || 'text'}`,
          branch: newBranchInfos.name,
          message: 'Some message…',
          content: Buffer.from(fileContent).toString('base64'),
        })
          .then(response => {
            octokit.request('POST /repos/{owner}/{repo}/pulls', {
              owner,
              repo,
              head: newBranchInfos.name,
              base: 'data',
              title: `Merge data from ${newBranchInfos.name}`,
              body: 'Some description…',
            }).then(response => {
              resolve(newBranchInfos.id)
            }).catch(reject)
          })
          .catch(reject)
      })
      .catch(reject)
  })
}

function loadDataTree({owner, repo}) {
  return new Promise(async (resolve, reject) => {
    if (!owner) {
      reject(new Error('Please provide an owner.'))
    }
    if (!repo) {
      reject(new Error('Please provide a repo.'))
    }

    const octokit = new Octokit({ auth: await getSecret('token') })

    octokit.request('GET /repos/{owner}/{repo}/contents/{path}?ref={ref}', {
      owner,
      repo,
      path: '',
      ref: 'data',
    })
      .then(dataBranchTreeResponse => {
        const files = dataBranchTreeResponse.data
          .filter(file => file.path === 'data')
          .map(file => file.sha)

        const dataTreeSHA = files[0]

        if (!dataTreeSHA) {
          reject(new Error('Could not get data-tree sha.'))
        } else {
          octokit.request('GET /repos/{owner}/{repo}/git/trees/{tree_sha}', {
            owner,
            repo,
            tree_sha: dataTreeSHA,
          })
            .then(dataTreeRespsonse => {
              resolve(
                dataTreeRespsonse.data.tree
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
  createBranchFromTemplate,
  commit,
  loadDataTree
}
