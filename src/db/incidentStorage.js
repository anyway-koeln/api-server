const path = require('path')
const { v4: uuidv4 } = require('uuid')

class IncidentStorage {
  constructor (db, octokitHelper) {
    this.db = db
    this.octokit = octokitHelper
    this.lastRefresh = new Date()
  }

  async loadData () {
    await this.octokit.ready
    await this.db.ready

    const dataBranchContent = await this.octokit.getDataBranchContent('data')

    const contentRequests = dataBranchContent.data.filter(file => file.path.endsWith('.md')).map(file => {
      return this.octokit.loadContentBySHA(file.sha).then(response => this.import(response.data.content, file.sha, file.path))
    })

    await Promise.all(contentRequests)
  }

  async refreshDB () {
    await this.octokit.ready
    await this.db.ready

    await this.db.dropIncidents()
    await this.loadData()
  }

  async import (content, sha, filePath) {
    await this.db.ready
    const newEntry = {}
    newEntry.content = content
    newEntry.basename = path.basename(filePath, path.extname(filePath))
    newEntry.sha = sha
    this.db.incidents.insertOne(newEntry)
  }

  async createIncidentPR (content, properties = {}) {
    await this.octokit.ready
    const newIncidentID = uuidv4()
    const branchName = `data-${newIncidentID}`
    await this.octokit.createNewDataBranch(branchName)
    await this.octokit.pushFileToDataBranch({ name: branchName, id: newIncidentID }, content, 'md')
    await this.octokit.createMergeRequest({ name: branchName, id: newIncidentID })
    return newIncidentID
  }

  async findByID (id) {
    await this.db.ready
    return await this.db.incidents.findOne({ basename: id }, {})
  }
}

module.exports = IncidentStorage
