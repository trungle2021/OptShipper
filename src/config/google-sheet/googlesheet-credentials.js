const { google } = require('googleapis')

const keyFile = 'src/config/google-sheet/info-credentials.json'
const scopes = 'https://www.googleapis.com/auth/spreadsheets'

const credentials = () => {
  return new google.auth.GoogleAuth({ keyFile, scopes })
}

module.exports = credentials
