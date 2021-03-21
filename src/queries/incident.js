module.exports = (parent, args, context, info) => {
  return context.incidentStorage.findByID(args.id)
}
