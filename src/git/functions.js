const { Octokit } = require('@octokit/core')
const { getSecret } = require('../secretManager')
const { v4: uuidv4 } = require('uuid')
const { createNewDataBranch } = require('./octokit-helpers')

async function createBranchFromTemplate () {
  const newDataID = uuidv4()
  const newBranchName = `data-${newDataID}`

  await createNewDataBranch(newBranchName)

  return { id: newDataID, name: newBranchName }
}

function commit ({ owner, repo, fileExtension, fileContent }) {
  return new Promise(async (resolve, reject) => {
    if (!owner) {
      reject(new Error('Please provide an owner.'))
    }
    if (!repo) {
      reject(new Error('Please provide a repo.'))
    }

    const octokit = new Octokit({ auth: await getSecret('token') })

    createBranchFromTemplate()
      .then(newBranchInfos => {
        console.log(newBranchInfos)
        octokit.request('PUT /repos/{owner}/{repo}/contents/{path}', {
          owner,
          repo,
          path: `data/${newBranchInfos.id}.${fileExtension || 'text'}`,
          branch: newBranchInfos.name,
          message: 'Some message…',
          content: Buffer.from(fileContent).toString('base64')
        })
          .then(response => {
            octokit.request('POST /repos/{owner}/{repo}/pulls', {
              owner,
              repo,
              head: newBranchInfos.name,
              base: 'data',
              title: `Merge data from ${newBranchInfos.name}`,
              body: 'Some description…'
            }).then(response => {
              resolve(newBranchInfos.id)
            }).catch(reject)
          })
          .catch(reject)
      })
      .catch(reject)
  })
}

function loadDataTree ({ owner, repo }) {
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
      ref: 'data'
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
            tree_sha: dataTreeSHA
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
  commit,
  loadDataTree
}
