const { google } = require('googleapis')
const API_VERSION = process.env.GOOGLE_SHEET_API_VERSION
const getGoogleSheetCredentials = require('./googlesheet-credentials')
const getGoogleSheetAuthClientByCredentials = require('./googlesheet-auth-client')
const logger = require('../../utils/logging/winston')

const googleSheetAPIConfig = async () => {
  const credentials = getGoogleSheetCredentials()
  logger.info('Load google-sheet credentials successfully')
  const authClient = await getGoogleSheetAuthClientByCredentials(credentials)
  logger.info('Create google-sheet auth client successfully')
  const sheetAPI = google.sheets({ version: API_VERSION, auth: authClient })
  logger.info('Create Google Sheet API successfully')
  return {
    credentials,
    authClient,
    sheetAPI
  }
}

module.exports = googleSheetAPIConfig
