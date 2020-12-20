const express = require('express')
const ApolloServer = require('apollo-server-express').ApolloServer

const typeDefs = require('./schema.js')
const resolvers = require('./resolvers.js')

const app = express()
const server = new ApolloServer({
  typeDefs,
  resolvers,
  tracing: true,
})
.applyMiddleware({ app, path: '/graphql', cors: true })

app.listen({ port: 4000 }, () =>
  console.log(`🚀 Server ready at http://localhost:4000${server.graphqlPath}`)
)
