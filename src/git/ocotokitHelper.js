const { Octokit } = require('@octokit/core')
const EventEmitter = require('events')

class OctokitHelper extends EventEmitter {
  constructor (authToken, owner, repo) {
    super()
    this.octokit = new Octokit({ auth: authToken })
    this.repoMetadata = { owner, repo }

    this.ready = new Promise(resolve => {
      this.on('ready', () => {
        resolve()
      })
    })
    this._initialize()
  }

  async _initialize () {
    this.templateBranch = await this._getTemplateBranch()
    this.emit('ready')
  }

  async _getTemplateBranch () {
    return await this.octokit.request('GET /repos/{owner}/{repo}/branches/{branch}', {
      ...this.repoMetadata,
      branch: 'template'
    })
  }

  async createNewDataBranch (dataBranchName) {
    return this.octokit.request('POST /repos/{owner}/{repo}/git/refs', {
      ...this.repoMetadata,
      ref: `refs/heads/${dataBranchName}`,
      sha: this.templateBranch.data.commit.sha
    })
  }

  async pushFileToDataBranch (branchMetadata, fileContent, fileExtension) {
    return this.octokit.request('PUT /repos/{owner}/{repo}/contents/{path}', {
      ...this.repoMetadata,
      path: `data/${branchMetadata.id}.${fileExtension || 'text'}`,
      branch: branchMetadata.name,
      message: 'Some message…',
      content: Buffer.from(fileContent).toString('base64')
    })
  }

  async createMergeRequest (branchMetadata) {
    return this.octokit.request('POST /repos/{owner}/{repo}/pulls', {
      ...this.repoMetadata,
      head: branchMetadata.name,
      base: 'data',
      title: `Merge data from ${branchMetadata.name}`,
      body: 'Some description…'
    })
  }

  async getDataBranchContent (path = '') {
    return this.octokit.request('GET /repos/{owner}/{repo}/contents/{path}?ref={ref}', {
      ...this.repoMetadata,
      path,
      ref: 'data'
    })
  }

  async getDataTree (treeSHA) {
    return await this.octokit.request('GET /repos/{owner}/{repo}/git/trees/{tree_sha}', {
      ...this.repoMetadata,
      tree_sha: treeSHA
    })
  }

  async loadContentBySHA (fileSHA) {
    return await this.octokit.request('GET /repos/{owner}/{repo}/git/blobs/{file_sha}', {
      ...this.repoMetadata,
      file_sha: fileSHA
    })
  }
}

module.exports = OctokitHelper
