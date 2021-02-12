const { Octokit } = require('@octokit/core')
const { getSecret } = require('../secretManager.js')
const { load_data_tree } = require('./functions.js')
const async = require('async')
const matter = require('gray-matter')
const { MongoClient } = require("mongodb")
const path = require('path')

function getFileBasename(git_path) {
    // Path way:
  return path.basename(git_path, path.extname(git_path))

    // RegExp way:
    // const match = git_path.match(/(?:.*\/|^)(.*)\..*?$/)
    // return match[1] || null
}

function annotate_file(file, callback) {
  file.basename = getFileBasename(file.path) // don't use the automatic mongoDB id but what we generated for git

  if (file.path.endsWith('.md')) {
    const data = matter(file.content_raw)
    file.content_markdown = data.content
    file.content_attributes = data.data
  }

  callback(file)
}

async function load_content(owner, repo, file_sha) {
  const octokit = new Octokit({ auth: await getSecret('token') })

  const response = await octokit.request('GET /repos/{owner}/{repo}/git/blobs/{file_sha}', {
    owner,
    repo,
    file_sha,
  })
  return response
}

async function load_existing_path_sha_pairs() {
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
            .reduce((sha_to_path_mapping, doc) => {
              sha_to_path_mapping[doc.path] = doc.sha
              return sha_to_path_mapping
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

function self_update () {
  return new Promise(async (resolve, reject) => {
    const owner = await getSecret('owner')
    const repo = await getSecret('incident_repo')

    const client = new MongoClient(await getSecret('mongodb_url'), { useUnifiedTopology: true })
    try {
      await client.connect()
      const database = client.db('cache')
      const collection = database.collection('incidents')

      load_data_tree({ owner, repo })
        .then(tree => {
          load_existing_path_sha_pairs()
            .then(async sha_to_path_mapping => {
              const markdown_files = tree.filter(file => file.path.endsWith('.md')) // only look at markdown files

              // delete all docs from db, that are not in 
              const paths = markdown_files.map(file => file.path)
              const paths_to_delete_from_db = Object.keys(sha_to_path_mapping)
                .filter(path => !paths.includes(path))
              for (const path of paths_to_delete_from_db) {
                await collection.deleteOne({ path })
              }

              const markdown_files_with_changes = markdown_files
                .filter(file =>
                  !(!!sha_to_path_mapping[file.path]) // file should not exists
                  || sha_to_path_mapping[file.path] !== file.sha // or should have different content
                )

              async.each(markdown_files_with_changes, (file, callback) => {
                load_content(owner, repo, file.sha)
                  .then(response => {
                    annotate_file({
                      path: file.path,
                      sha: file.sha,
                      // mode: file.mode,
                      // type: file.type,
                      // size: file.size,
                      content_raw: Buffer.from(response.data.content, 'base64').toString('utf-8'),
                    }, async file => {
                      if (!(!!sha_to_path_mapping[file.path])) { // insert new db entry
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

module.exports = self_update
