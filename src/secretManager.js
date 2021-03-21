const env = require('node-env-file')
env(`${__dirname}/../.env`)

function getSecret (secretName) {
  const secret = process.env[secretName]
  if (secret) {
    return secret
  }
  throw new Error(`No secret with key ${secretName} specified!`)
}

module.exports = {
  getSecret: getSecret
}
