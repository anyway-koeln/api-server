const events = require('events')
const path = require('path')
const fse = require('fs-extra')
const Git = require('nodegit')
const { v4: uuidv4 } = require('uuid');
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
    await this._ready
  }

  async publish (data) {
    await this.ready()

    const cloneOpts = this._defaultCloneOpts
    cloneOpts.checkoutBranch = 'template'

    const newDataUUID = uuidv4()
    const tempRepositoryPath = path.join(this.directories.push, newDataUUID)

    const repository = await Git.Clone(
      this.url,
      tempRepositoryPath,
      cloneOpts
    )

    const tempRepositoryDataDirPath = path.join(tempRepositoryPath, 'data')

    const repositoryHeadCommit = await repository.getHeadCommit()
    const newBranch = await repository.createBranch(newDataUUID, repositoryHeadCommit, false)
    await repository.checkoutBranch(newBranch)

    const dataFilePath = path.join(tempRepositoryDataDirPath, `${newDataUUID}.json`)
    await fse.writeJSON(dataFilePath, data)

    const index = await repository.refreshIndex()
    await index.addByPath(path.posix.join('data', `${newDataUUID}.json`))
    await index.write()

    const oid = await index.writeTree()

    await repository.createCommit(
      'HEAD',
      Git.Signature.now('DataBot', 'none@bot.com'),
      Git.Signature.now('DataBot', 'none@bot.com'),
      `publish/${newDataUUID}`,
      oid,
      [repositoryHeadCommit]
    )

    const remote = await repository.getRemote('origin')
    await remote.push(
      [`refs/heads/${newDataUUID}:refs/heads/${newDataUUID}`],
      this._defaultPushOpts
    )

    return newDataUUID
  }

  async _initialize () {
    this.token = await getSecret('token')
    this.url = await getSecret(`${this.name}_repository`)
    await this._initializeDirectories()
    const cloneOpts = this._defaultCloneOpts
    cloneOpts.checkoutBranch = 'data'
    try {
      this.mainRegistry = await Git.Clone(this.url, this.directories.main, cloneOpts)
    } catch (error) {
      throw new Error('Error during main repository cloning: ' + error)
    }
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
