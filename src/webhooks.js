const updateIndexes = require('./git/updateIndexes.js')

export default function initWebhoks (app) {
  app.get('/self_update', (req, res) => {
    res.send('Please use POST.')
  })

  app.post('/self_update', (req, res) => {
    const payload = req.body
    console.log(payload)
    if (
      payload.action === 'closed' &&
      payload.pull_request.state === 'closed' &&
      payload.pull_request.merged === true
    ) {
    // Update Indexes
      updateIndexes()
        .then(() => res.send('updated'))
        .catch(error => res.send('error'))
    } else if (
      payload.action === 'opened' &&
      payload.pull_request.state === 'open' &&
      payload.pull_request.merged === false
    ) {
      res.send('opened')
      // TODO send info about new data to review
    }
  })
}
