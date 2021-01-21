const events = require('events')
const path = require('path')
const fse = require('fs-extra')
const Git = require('nodegit')
const { v4: uuidv4 } = require('uuid')
const { getSecret } = require('../secretManager')
const Stream = require('stream')
const Mutex = require('async-mutex').Mutex

const GIT_DB_DIR = path.join(process.cwd(), 'gitdb')

class GitHubStore extends events.EventEmitter {
  constructor (name, opts) {
    super()
    opts = opts || {}
    this._ready = new Promise((resolve, reject) => {
      this.on('ready', () => {
        resolve()
      })
    })
    this.name = name
    this.pullRequestBased = opts.pullRequestBased || false
    this.pushMutex = new Mutex()
    this._initialize()
  }

  async ready () {
    await this._ready
  }

  async push (data) {
    await this.ready()

    const release = await this.pushMutex.acquire()
    try {
      const newDataUUID = uuidv4()

      const repositoryDataDirPath = path.join(this.directories.root, 'data')

      await this.mainRegistry.checkoutBranch('origin/template')
      const templateBranch = await this.mainRegistry.getBranch('refs/remotes/origin/template')
      await this.mainRegistry.checkoutRef(templateBranch)
      const repositoryHeadCommit = await this.mainRegistry.getHeadCommit()
      const newBranch = await this.mainRegistry.createBranch(newDataUUID, repositoryHeadCommit, false)
      await this.mainRegistry.checkoutBranch(newBranch)

      const dataFilePath = path.join(repositoryDataDirPath, `${newDataUUID}.json`)
      await fse.writeJSON(dataFilePath, data)

      const index = await this.mainRegistry.refreshIndex()
      await index.addByPath(path.posix.join('data', `${newDataUUID}.json`))
      await index.write()

      const oid = await index.writeTree()

      await this.mainRegistry.createCommit(
        'HEAD',
        Git.Signature.now('DataBot', 'none@bot.com'),
        Git.Signature.now('DataBot', 'none@bot.com'),
        `publish/${newDataUUID}`,
        oid,
        [repositoryHeadCommit]
      )

      const remote = await this.mainRegistry.getRemote('origin')
      await remote.push(
        [`refs/heads/${newDataUUID}:refs/heads/${newDataUUID}`],
        this._defaultPushOpts
      )

      if (this.pullRequestBased) {
        // TODO
      }
      return newDataUUID
    } finally {
      release()
    }
  }

  async _initialize () {
    this.token = await getSecret('token')
    this.url = await getSecret(`${this.name}_repository`)
    await this._initializeDirectories()
    const cloneOpts = this._defaultCloneOpts
    cloneOpts.checkoutBranch = 'data'
    try {
      this.mainRegistry = await Git.Clone(this.url, this.directories.root, cloneOpts)
    } catch (error) {
      throw new Error('Error during main repository cloning: ' + error)
    }
    this.emit('ready')
  }

  async _initializeDirectories () {
    await fse.ensureDir(GIT_DB_DIR)
    this.directories = {}
    this.directories.root = path.join(GIT_DB_DIR, this.name)
    await fse.emptyDir(this.directories.root)
  }

  async createInitialDataStream () {
    const files = await fse.readdir(path.join(this.directories.root, 'data'))
    const jsonFiles = files.filter(el => /\.json$/.test(el))
    const readableStream = new Stream.Readable()
    jsonFiles.forEach(file => readableStream.push(fse.readFileSync(path.join(this.directories.root, 'data', file))))
    readableStream.push(null)
    return readableStream
  }

  get _defaultCloneOpts () {
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

  get _defaultPushOpts () {
    const self = this
    return {
      callbacks: {
        certificateCheck: function () { return 0 },
        credentials: function () {
          return Git.Cred.userpassPlaintextNew(self.token, 'x-oauth-basic')
        }
      }
    }
  }
}

module.exports = GitHubStore
