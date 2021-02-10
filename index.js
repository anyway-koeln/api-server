const express = require('express')
const ApolloServer = require('apollo-server-express').ApolloServer

const { getSecret } = require('./src/secretManager.js')
// const GitStore = require('./src/git/git-hub-store')

const typeDefs = require('./src/schema.js')
const resolvers = require('./src/resolvers.js')

const update_indexes = require('./src/git/update_indexes.js')

// const incidentStore = new GitStore('incident')

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
    console.log(req.query)
    console.log(req.body)

    res.send('-')

    // update_indexes()
    // .then(() => res.send('updated'))
    // .catch(err => res.send('error'))
})

app.post('/self_update', (req, res) => {
    console.log(req.query)
    console.log(req.body)
    
    res.send('-')

    // update_indexes()
    // .then(() => res.send('updated'))
    // .catch(err => res.send('error'))
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
