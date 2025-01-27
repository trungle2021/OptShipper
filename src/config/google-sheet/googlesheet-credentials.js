const { google } = require('googleapis')

const keyFile = './apps/google_sheet/config/info-credentials.json'
const scopes = 'https://www.googleapis.com/auth/spreadsheets'

const credentials = () => {
  return new google.auth.GoogleAuth({ keyFile, scopes })
}

module.exports = credentials
