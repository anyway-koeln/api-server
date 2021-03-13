const { getSecret } = require('../src/secretManager')

describe('secretManager', () => {
  beforeEach(() => {
    process.env = {}
  })

  it('returns secret if specified in env', () => {
    process.env.VALUE = 'test'
    expect(getSecret('VALUE')).toBe('test')
  })

  it('throws error if specified in env', () => {
    expect(() => getSecret('VALUE')).toThrow()
  })
})
