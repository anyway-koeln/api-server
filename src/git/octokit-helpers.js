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

exports.createNewRef = async () => {
  const { octokit, owner, repo } = await getRepositoryData()

}
