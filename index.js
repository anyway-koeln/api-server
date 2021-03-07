const express = require('express')
const ApolloServer = require('apollo-server-express').ApolloServer

const { getSecret } = require('./src/secretManager.js')

const typeDefs = require('./src/schema.js')
const resolvers = require('./src/resolvers.js')

const updateIndexes = require('./src/git/updateIndexes.js')

const app = express()
app.use(express.json())

new ApolloServer({
  typeDefs,
  resolvers,
  tracing: true,
  context: async ({ req }) => {
    return {
      getSecret,
    //   incidentStore
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

app.get('/self_update', (req, res) => {
    res.send('Please use POST.')
})

app.post('/self_update', (req, res) => {
    const payload = req.body

    if (
        payload.action === 'closed'
        && payload.pull_request.state === 'closed'
        && payload.pull_request.merged === true
    ) {
        // Update Indexes
        updateIndexes()
        .then(() => res.send('updated'))
        .catch(error => res.send('error'))
    } else if (
        payload.action === 'opened'
        && payload.pull_request.state === 'open'
        && payload.pull_request.merged === false
    ) {
        res.send('opened')
        // TODO send info about new data to review
    }
})

const port = 4000
const host = '0.0.0.0' // Uberspace wants 0.0.0.0
app.listen({ port, host }, () =>
  console.info(`
    🚀 Server ready
    View the API at http://${host}:${port}/graphql
    Call the self update script at http://${host}:${port}/self_update
  `)
)
