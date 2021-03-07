const { v4: uuidv4 } = require('uuid')
const {
  createNewDataBranch, pushFileToDataBranch, createMergeRequest,
  getDataBranchTree, getDataTree
} = require('./octokit-helpers')

async function createBranchFromTemplate () {
  const newDataID = uuidv4()
  const newBranchName = `data-${newDataID}`

  await createNewDataBranch(newBranchName)

  return { id: newDataID, name: newBranchName }
}

async function commit ({ fileExtension, fileContent }) {
  const branchMetadata = await createBranchFromTemplate()
  await pushFileToDataBranch(branchMetadata, fileContent, fileExtension)
  await createMergeRequest(branchMetadata)

  return branchMetadata.id
}

async function loadDataTree () {
  const dataBranchTreeResponse = await getDataBranchTree()

  const files = dataBranchTreeResponse.data
    .filter(file => file.path === 'data')
    .map(file => file.sha)

  const dataTreeSHA = files[0]

  if (!dataTreeSHA) {
    throw new Error('Could not get data tree SHA')
  }

  const dataTreeResponse = await getDataTree(dataTreeSHA)

  return dataTreeResponse.data.tree.filter(file => file.path !== '.gitkeep')
}

module.exports = {
  commit,
  loadDataTree
}
