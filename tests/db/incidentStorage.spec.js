const IncidentStorage = require('../../src/db/incidentStorage')
const DB = require('../../src/db/db')
const Frontmatter = require('../../src/db/frontmatter')

const OctokitHelper = require('../../src/git/ocotokitHelper')

const mockInsertOne = jest.fn()

jest.mock('uuid', () => {
  return {
    v4: jest.fn(() => 1)
  }
})

jest.mock('../../src/db/db', () => {
  return jest.fn().mockImplementation(() => {
    return {
      incidents: { insertOne: mockInsertOne },
      ready: Promise.resolve()
    }
  })
})

jest.mock('../../src/db/frontmatter', () => {
  return jest.fn().mockImplementation(() => {
    return {
      extract () { return { text: 'text', properties: { test: 'test' } } },
      add () { return 'I am text with frontmatter' }
    }
  })
})

jest.mock('')

const mockCreateNewDataBranch = jest.fn().mockResolvedValue()
const mockPushFileToDataBranch = jest.fn().mockResolvedValue()
const mockCreateMergeRequest = jest.fn().mockResolvedValue()

jest.mock('../../src/git/ocotokitHelper', () => {
  return jest.fn().mockImplementation(() => {
    return {
      createNewDataBranch: mockCreateNewDataBranch,
      pushFileToDataBranch: mockPushFileToDataBranch,
      createMergeRequest: mockCreateMergeRequest
    }
  })
})

describe('incidentStorage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('imports file', async () => {
    const incidentStorage = new IncidentStorage(new DB(), new OctokitHelper(), new Frontmatter())

    const markdownContent = 'This is test content!'
    await incidentStorage.import(markdownContent, 'testSHA', '/test/file.md')

    expect(mockInsertOne).toBeCalledTimes(1)
    expect(mockInsertOne).toHaveBeenCalledWith({
      basename: 'file',
      text: 'text',
      properties: { test: 'test' },
      sha: 'testSHA'
    })
  })

  it('creates pr', async () => {
    const incidentStorage = new IncidentStorage(new DB(), new OctokitHelper(), new Frontmatter())

    await incidentStorage.createIncidentPR('This is my story...', {})

    expect(mockCreateNewDataBranch).toBeCalledTimes(1)
    expect(mockCreateNewDataBranch).toHaveBeenCalledWith('data-1')

    expect(mockPushFileToDataBranch).toBeCalledTimes(1)
    expect(mockPushFileToDataBranch).toHaveBeenCalledWith({ name: 'data-1', id: 1 }, 'I am text with frontmatter', 'md', 'This is my story...')

    expect(mockCreateMergeRequest).toBeCalledTimes(1)
    expect(mockCreateMergeRequest).toHaveBeenCalledWith({ name: 'data-1', id: 1 }, 'This is my story...')
  })
})
