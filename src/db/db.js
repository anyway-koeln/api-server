const { MongoClient } = require('mongodb')
const { getSecret } = require('../secretManager')
const EventEmitter = require('events')

class DB extends EventEmitter {
  constructor () {
    super()

    this.client = new MongoClient(getSecret('mongodb_url'), { useUnifiedTopology: true })

    this.ready = new Promise(resolve => {
      this.on('ready', () => {
        resolve()
      })
    })
    this.initialize()
  }

  async initialize () {
    await this.client.connect()
    this.database = this.client.db('cache')
    await this.database.collection('incidents').drop()
    this.incidents = this.database.collection('incidents')
    this.emit('ready')
  }
}

module.exports = DB
