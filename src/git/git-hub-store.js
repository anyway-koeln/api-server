const events = require('events')
const path = require('path')
const fse = require('fs-extra')
const Git = require('nodegit')
const { getSecret } = require('../secretManager')

const GIT_DB_DIR = path.join(process.cwd(), 'gitdb')

class GitHubStore extends events.EventEmitter {
  constructor (name) {
    super()
    this._ready = new Promise((resolve, reject) => {
      this.on('ready', () => {
        resolve()
      })
    })
    this.name = name
    this._initialize()
  }

  async ready () {
    await this._ready()
  }

  async _initialize () {
    this.token = await getSecret('token')
    this.url = await getSecret(`${this.name}_repository`)
    await this._initializeDirectories()
    const cloneOpts = this.defaultCloneOpts
    cloneOpts.checkoutBranch = 'data'
    Git.Clone(this.url, this.directories.main, this.defaultCloneOpts)
      .then((data) => {})
      .catch(err => {
        throw new Error('Error during main repository cloning: ' + err)
      })
    this.emit('ready')
  }

  async _initializeDirectories () {
    await fse.ensureDir(GIT_DB_DIR)
    this.directories = {}
    this.directories.root = path.join(GIT_DB_DIR, this.name)
    await fse.ensureDir(this.directories.root)
    this.directories.main = path.join(this.directories.root, 'main')
    await fse.emptyDir(this.directories.main)
    this.directories.push = path.join(this.directories.root, 'push')
    await fse.emptyDir(this.directories.push)
  }

  get defaultCloneOpts () {
    const self = this
    return {
      fetchOpts: {
        callbacks: {
          certificateCheck: function () { return 0 },
          credentials: function () {
            return Git.Cred.userpassPlaintextNew(self.token, 'x-oauth-basic')
          }
        }
      }
    }
  }
}

module.exports = GitHubStore
