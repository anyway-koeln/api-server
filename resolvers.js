const { GraphQLJSON, GraphQLJSONObject } = require('graphql-type-json')

// const {
// 	GraphQLDate,
// 	GraphQLTime,
// 	GraphQLDateTime,
// } = require('graphql-iso-date')

const query_incident = require('./queries/incident.js')
const query_questions = require('./queries/questions.js')
const mutation_incident = require('./mutations/incident.js')
const mutation_answers = require('./mutations/answers.js')

module.exports = {
	// JSON: GraphQLJSON,
	JSONObject: GraphQLJSONObject,
	// DateTime: GraphQLDateTime,

	Query: {
		incident: query_incident,
		questions: query_questions,
	},
	Mutation: {
		incident: mutation_incident,
		answers: mutation_answers,
	},
}
