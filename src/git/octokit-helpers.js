const { Octokit } = require('@octokit/core')
const { getSecret } = require('../secretManager')

// some values, that only need to be initialized once

let _octokit
let _owner
let _repo
async function getRepositoryData () {
  if (!_octokit) {
    const token = await getSecret('token')
    _octokit = new Octokit({ auth: token })
    _owner = await getSecret('owner')
    _repo = await getSecret('incident_repo')
  }
  return { octokit: _octokit, repo: _repo, owner: _owner }
}

let _templateBranch
async function getTemplateBranch () {
  const { octokit, owner, repo } = await getRepositoryData()
  if (!_templateBranch) {
    _templateBranch = await octokit.request('GET /repos/{owner}/{repo}/branches/{branch}', {
      owner,
      repo,
      branch: 'template'
    })
  }
  return _templateBranch
}

// functions that wrap around octokit

exports.createNewDataBranch = async (dataBranchName) => {
  const { octokit, owner, repo } = await getRepositoryData()
  const templateBranch = await getTemplateBranch()

  return octokit.request('POST /repos/{owner}/{repo}/git/refs', {
    owner,
    repo,
    ref: `refs/heads/${dataBranchName}`,
    sha: templateBranch.data.commit.sha
  })
}

exports.pushFileToDataBranch = async (branchMetadata, fileContent, fileExtension) => {
  const { octokit, owner, repo } = await getRepositoryData()

  return octokit.request('PUT /repos/{owner}/{repo}/contents/{path}', {
    owner,
    repo,
    path: `data/${branchMetadata.id}.${fileExtension || 'text'}`,
    branch: branchMetadata.name,
    message: 'Some message…',
    content: Buffer.from(fileContent).toString('base64')
  })
}

exports.createMergeRequest = async (branchMetadata) => {
  const { octokit, owner, repo } = await getRepositoryData()

  return octokit.request('POST /repos/{owner}/{repo}/pulls', {
    owner,
    repo,
    head: branchMetadata.name,
    base: 'data',
    title: `Merge data from ${branchMetadata.name}`,
    body: 'Some description…'
  })
}

exports.getDataBranchTree = async () => {
  const { octokit, owner, repo } = await getRepositoryData()

  return octokit.request('GET /repos/{owner}/{repo}/contents/{path}?ref={ref}', {
    owner,
    repo,
    path: '',
    ref: 'data'
  })
}

exports.getDataTree = async (treeSHA) => {
  const { octokit, owner, repo } = await getRepositoryData()

  octokit.request('GET /repos/{owner}/{repo}/git/trees/{tree_sha}', {
    owner,
    repo,
    tree_sha: treeSHA
  })
}
