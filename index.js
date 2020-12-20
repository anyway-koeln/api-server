const express = require('express')
const ApolloServer = require('apollo-server-express').ApolloServer

const { getSecret } = require('./secretManager.js')

const typeDefs = require('./schema.js')
const resolvers = require('./resolvers.js')

const app = express()
new ApolloServer({
  typeDefs,
  resolvers,
  tracing: true,
  context: async ({req}) => {
    return {
      getSecret
    }
  },
})
.applyMiddleware({ app, path: '/graphql', cors: true })

const port = 4000
const host = '0.0.0.0' // Uberspace wants 0.0.0.0
app.listen({ port, host }, () =>
  console.info(`🚀 Server ready at http://${host}:${port}/graphql`)
)
