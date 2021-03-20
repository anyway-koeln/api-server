module.exports = async (parent, args, context, info) => {
  const text = args.text || ''
  const properties = args.properties || {}

  return context.incidentStorage.createIncidentPR(text, properties)
}
