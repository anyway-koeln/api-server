const { Octokit } = require('@octokit/core')
const { getSecret } = require('../secretManager.js')
const { loadDataTree } = require('./functions.js')
const async = require('async')
const matter = require('gray-matter')
const { MongoClient } = require('mongodb')
const path = require('path')

function getFileBasename (gitPath) {
    // Path way:
  return path.basename(gitPath, path.extname(gitPath))

    // RegExp way:
    // const match = gitPath.match(/(?:.*\/|^)(.*)\..*?$/)
    // return match[1] || null
}

function annotateFile (file, callback) {
  file.basename = getFileBasename(file.path) // don't use the automatic mongoDB id but what we generated for git

  if (file.path.endsWith('.md')) {
    const data = matter(file.content_raw)
    file.content_markdown = data.content
    file.content_attributes = data.data
  }

  callback(file)
}

async function loadContent (owner, repo, fileSHA) {
  const octokit = new Octokit({ auth: await getSecret('token') })

  const response = await octokit.request('GET /repos/{owner}/{repo}/git/blobs/{file_sha}', {
    owner,
    repo,
    file_sha: fileSHA
  })
  return response
}

async function loadExistingPathSHAPairs () {
  return new Promise(async (resolve, reject) => {
    const client = new MongoClient(await getSecret('mongodb_url'), { useUnifiedTopology: true })
    try {
      await client.connect()
      const database = client.db('cache')
      const collection = database.collection('incidents')

      const cursor = collection.find({}, {
        projection: { _id: 0, path: 1, sha: 1 },
      })

      if ((await cursor.count()) === 0) {
        resolve({})
      } else {
        resolve(
          (await cursor.toArray())
            .reduce((SHAToPathMapping, doc) => {
              SHAToPathMapping[doc.path] = doc.sha
              return SHAToPathMapping
            }, {})
        )
      }
    } catch (error) {
      reject(error)
    } finally {
      await client.close()
    }
  })
}

function selfUpdate () {
  return new Promise(async (resolve, reject) => {
    const owner = await getSecret('owner')
    const repo = await getSecret('incident_repo')

    const client = new MongoClient(await getSecret('mongodb_url'), { useUnifiedTopology: true })
    try {
      await client.connect()
      const database = client.db('cache')
      const collection = database.collection('incidents')

      loadDataTree({ owner, repo })
        .then(tree => {
          loadExistingPathSHAPairs()
            .then(async SHAToPathMapping => {
              const markdownFiles = tree.filter(file => file.path.endsWith('.md')) // only look at markdown files

              // delete all docs from db, that are not in 
              const paths = markdownFiles.map(file => file.path)
              const PathsToDeleteFromDB = Object.keys(SHAToPathMapping)
                .filter(path => !paths.includes(path))
              for (const path of PathsToDeleteFromDB) {
                await collection.deleteOne({ path })
              }

              const MarkdownFilesWithChanges = markdownFiles
                .filter(file =>
                  !SHAToPathMapping[file.path] || // file should not exists
                  SHAToPathMapping[file.path] !== file.sha // or should have different content
                )

              async.each(MarkdownFilesWithChanges, (file, callback) => {
                loadContent(owner, repo, file.sha)
                  .then(response => {
                    annotateFile({
                      path: file.path,
                      sha: file.sha,
                      // mode: file.mode,
                      // type: file.type,
                      // size: file.size,
                      content_raw: Buffer.from(response.data.content, 'base64').toString('utf-8'),
                    }, async file => {
                      if (!SHAToPathMapping[file.path]) { // insert new db entry
                        await collection.insertOne(file)
                      } else { // replace/update existing db entry
                        await collection.replaceOne({path: file.path}, file, {upsert: true})
                      }
                      callback()
                    })
                  })
                  .catch(callback)
              }, async error => {
                await client.close()
                if (error) {
                  reject(error)
                } else {
                  resolve('All files have been processed successfully')
                }
              })
            })
            .catch(reject)
        }).catch(reject)
    } catch (error) {
      reject(error)
    }
  })
}

module.exports = selfUpdate
