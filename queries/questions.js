
const questions = [
	{
		id: 'q1',
		question: 'Wie viele Täter?',
		description: 'Beschreibung',
		in_one_word: 'Täter',
		icon: '',
		answer_type: 'number',
		answer_options: {},
		answer_value_suggestion: {},
	},
	{
		id: 'q2',
		question: 'Wo war es?',
		description: 'Beschreibung',
		in_one_word: 'Ort',
		icon: '',
		answer_type: 'address',
		answer_options: {},
		answer_value_suggestion: {},
	},
]

module.exports = (parent, args, context, info) => {	
	return new Promise((resolve,reject)=>{
		resolve(questions)
	})
}
