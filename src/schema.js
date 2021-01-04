const {gql} = require('apollo-server-express')

const schema = gql`
	scalar JSONObject

	type Query {
		incident(id: ID): Incident
		questions(text: String): [Question]
	}

	type Mutation {
		incident(text: String): ID
		answers(answers: [Answer]): [ID]
	}

	type Incident {
		id: ID
		text: String
	}

	type Question {
		id: ID
		question: String
		description: String
		in_one_word: String
		icon: String
		answer_type: AnswerType
		answer_options: JSONObject
		answer_value_suggestion: JSONObject
	}

	input Answer {
		incident_id: ID
		question_id: ID
		type: AnswerType
		value: JSONObject
	}

	enum AnswerType {
		text
		address
		number
	}
`

module.exports = schema
