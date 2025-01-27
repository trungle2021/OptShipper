const getGoogleSheetAuthClientByCredentials = async (credentials) => {
  return await credentials.getClient()
}

module.exports = getGoogleSheetAuthClientByCredentials
