const path = require('path')
const { v4: uuidv4 } = require('uuid')

class IncidentStorage {
  constructor (db, octokitHelper) {
    this.db = db
    this.ocotokit = octokitHelper
  }

  async loadInitialData () {
    await this.ocotokit.ready
    await this.db.ready

    const dataBranchContent = await this.ocotokit.getDataBranchContent('data')

    const contentRequests = dataBranchContent.data.filter(file => file.path.endsWith('.md')).map(file => {
      return this.ocotokit.loadContentBySHA(file.sha).then(response => this.import(response.data.content, file.sha, file.path))
    })

    await Promise.all(contentRequests)
  }

  async import (content, sha, filePath) {
    await this.db.ready
    const newEntry = {}
    newEntry.content = Buffer.from(content, 'base64').toString('utf-8')
    newEntry.basename = path.basename(filePath, path.extname(filePath))
    newEntry.sha = sha
    console.log(newEntry.content)
    this.db.incidents.insertOne(newEntry)
  }

  async createIncidentPR (content, properties = {}) {
    await this.ocotokit.ready
    const newIncidentID = uuidv4()
    const branchName = `data-${newIncidentID}`
    await this.ocotokit.createNewDataBranch(branchName)
    await this.ocotokit.pushFileToDataBranch({ name: branchName, id: newIncidentID }, content, 'md')
    await this.ocotokit.createMergeRequest({ name: branchName, id: newIncidentID })
    return newIncidentID
  }

  async findByID (id) {
    await this.db.ready
    const incident = await this.db.incidents.findOne({ basename: id }, {})
    console.log(incident)
    return await this.db.incidents.findOne({ basename: id }, {})
  }
}

module.exports = IncidentStorage
