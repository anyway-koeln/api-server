const path = require('path')
const { v4: uuidv4 } = require('uuid')

class IncidentStorage {
  constructor (db, octokitHelper, frontmatter) {
    this.db = db
    this.ocotokit = octokitHelper
    this.frontmatter = frontmatter
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
    const { text, properties } = this.frontmatter.extract(content)
    newEntry.properties = properties
    newEntry.text = text
    newEntry.basename = path.basename(filePath, path.extname(filePath))
    newEntry.sha = sha
    this.db.incidents.insertOne(newEntry)
  }

  async createIncidentPR (text, properties = {}) {
    text = text.trim()

    const content = this.frontmatter.add(text, properties)

    let preview = ''
    if (text.length > 50) {
      preview = text.slice(0, 49) + '…'
    } else {
      preview = text
    }

    await this.ocotokit.ready
    const newIncidentID = uuidv4()
    const branchName = `data-${newIncidentID}`
    await this.ocotokit.createNewDataBranch(branchName)
    await this.ocotokit.pushFileToDataBranch({ name: branchName, id: newIncidentID }, content, 'md', preview)
    await this.ocotokit.createMergeRequest({ name: branchName, id: newIncidentID }, preview)
    return newIncidentID
  }

  async findByID (id) {
    await this.db.ready
    return await this.db.incidents.findOne({ basename: id }, {})
  }
}

module.exports = IncidentStorage
