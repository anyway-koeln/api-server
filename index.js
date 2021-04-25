const express = require('express')
const cron = require('node-cron')
const ApolloServer = require('apollo-server-express').ApolloServer

const { getSecret } = require('./src/secretManager.js')

const typeDefs = require('./src/schema.js')
const resolvers = require('./src/resolvers.js')

// const initWebhooks = require('./src/webhooks.js')

const DB = require('./src/db/db')
const IncidentStorage = require('./src/db/incidentStorage')
const OctokitHelper = require('./src/git/ocotokitHelper')
const Frontmatter = require('./src/db/frontmatter.js')

const app = express()
app.use(express.json())

const octokitHelper = new OctokitHelper(getSecret('token'), getSecret('owner'), getSecret('incident_repo'))
const db = new DB()
const incidentStorage = new IncidentStorage(db, octokitHelper, new Frontmatter())

incidentStorage.loadData()

cron.schedule('0 0 * * *', () => {
  incidentStorage.refreshDB()
})

new ApolloServer({
  typeDefs,
  resolvers,
  tracing: true,
  context: async ({ req }) => {
    return {
      getSecret,
      incidentStorage
    }
  }
}).applyMiddleware({ app, path: '/graphql', cors: true })

app.get('/', (req, res) => {
  res.send(`
      <title>anyway API</title>
      View the API at <a href="./graphql">./graphql</a><br>
      Call the self update script with POST at ./self_update<br>
      <hr>
      Repo: <a href="https://github.com/anyway-koeln/api-server">https://github.com/anyway-koeln/api-server</a>
  `)
})

// initWebhooks(app)

const port = 4000
const host = '0.0.0.0' // Uberspace wants 0.0.0.0
app.listen({ port, host }, () =>
  console.info(`
    🚀 Server ready
    View the API at http://${host}:${port}/graphql
    Call the self update script at http://${host}:${port}/self_update
  `)
)
