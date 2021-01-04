const express = require('express')
const ApolloServer = require('apollo-server-express').ApolloServer

const { getSecret } = require('./src/secretManager.js')
const GitStore = require('./src/git/git-hub-store')

const typeDefs = require('./src/schema.js')
const resolvers = require('./src/resolvers.js')

const incidentStore = new GitStore('incident')

const app = express()
new ApolloServer({
  typeDefs,
  resolvers,
  tracing: true,
  context: async ({ req }) => {
    return {
      getSecret,
      incidentStore
    }
  }
}).applyMiddleware({ app, path: '/graphql', cors: true })

const port = 4000
const host = 'localhost' // Uberspace wants 0.0.0.0
app.listen({ port, host }, () =>
  console.info(`🚀 Server ready at http://${host}:${port}/graphql`)
)
