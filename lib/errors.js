const { colorize } = require('../lib/logger')

const NO_MESSAGE = (message) => `${colorize('warning', `'${message}'`)} message is not defined`

const MASTER_ERRORS = {
  NO_MESSAGE,
  NO_FILES: 'Missing files to test',
  NO_CONFIG: 'Missing config file',
  NO_GLOB_RESULT: (glob) => `No files found in glob ${colorize('warning', `'${glob}'`)})`
}

const WORKER_ERRORS = {
  NO_MESSAGE,
  NO_WORKER: 'Worker is not defined'
}

module.exports = { MASTER_ERRORS, WORKER_ERRORS }
