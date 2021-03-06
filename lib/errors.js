const { colorize } = require('../lib/logger')

const NO_MESSAGE = (message) => `${colorize('warning', `'${message}'`)} message is not defined`

const MASTER_ERRORS = {
  NO_MESSAGE,
  NO_FILES: 'Missing files to test',
  NO_CONFIG: 'Missing config file',
  NO_STATS: 'Missing stats to add',
  NO_GLOB_RESULT: (glob) => `No files found in glob ${colorize('warning', `'${glob}'`)})`,
  NO_LOOKUPS: 'You need to send an array of paths in order to lookup at them',
  FILES_ALREADY_COLLECTED: 'This function has been already called and it has files loaded'
}

const WORKER_ERRORS = {
  NO_MESSAGE,
  NO_WORKER: 'Worker is not defined'
}

module.exports = { MASTER_ERRORS, WORKER_ERRORS }
