const path = require('path')
const { v4: uuidv4 } = require('uuid')
const yaml = require('js-yaml')

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

  parseContent (content) {
    const lines = content.split('\n')

    let text = null
    let properties = {}

    let start = lines.indexOf('---')
    if (start > -1) {
      start += 1
      const end = lines.indexOf('---', start)
      if (end > -1) {
        const section = lines.slice(start, end).join('\n')
        text = lines.slice(end + 1).join('\n')

        try {
          properties = yaml.load(section)
        } catch (error) {
          console.error(error)
        }
      }
    }

    if (text === null) {
      text = content
    }

    return {
      text,
      properties
    }
  }

  async import (content, sha, filePath) {
    await this.db.ready
    const newEntry = {}
    newEntry.content = Buffer.from(content, 'base64').toString('utf-8')
    const { text, properties } = this.parseContent(newEntry.content)
    newEntry.properties = properties
    newEntry.text = text
    newEntry.basename = path.basename(filePath, path.extname(filePath))
    newEntry.sha = sha
    this.db.incidents.insertOne(newEntry)
  }

  async createIncidentPR (text, properties = {}) {
    const content = [
      '---',
      yaml.dump(properties, { skipInvalid: true, lineWidth: -1 }).trim(),
      '---',
      text.trim()
    ].join('\n')

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
    return await this.db.incidents.findOne({ basename: id }, {})
  }
}

module.exports = IncidentStorage
