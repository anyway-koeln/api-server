const express = require('express')
const { ApolloServer, gql } = require('apollo-server-express')

const typeDefs = gql`
  type Query {
    questions(freitext: String): [String]
  }
`

const resolvers = {
  Query: {
    questions: (props) => {
      console.log(props.freitext)
      return [props.freitext]
    }
  }
}

const app = express()
const server = new ApolloServer({
  typeDefs,
  resolvers
})
.applyMiddleware({ app, path: '/graphql', cors: true })

app.listen({ port: 4000 }, () =>
  console.log(`🚀 Server ready at http://localhost:4000${server.graphqlPath}`)
)
