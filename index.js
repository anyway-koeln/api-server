const express = require('express')
const { graphqlHTTP } = require('express-graphql')
const { buildSchema } = require('graphql')

const schema = buildSchema(`
  type Query {
    questions(freitext: String): [String]
  }
`)

const root = {
  questions: (props) => {
    console.log(props.freitext)
    return [props.freitext]
  }
}

const app = express()
app.use('/graphql', graphqlHTTP({
  schema: schema,
  rootValue: root,
  graphiql: true
}))
app.listen(4000)
console.log('Running a GraphQL API server at http://localhost:4000/graphql')
