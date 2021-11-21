const MASTER_ERRORS = {
  NO_MESSAGE: 'This message does not exist',
  NO_FILES: 'Missing files to test',
  NO_CONFIG: 'Missing config file',
  NO_GLOB_RESULT: (glob) => `No files found in glob '${glob}'`
}

const WORKER_ERRORS = {
  NO_MESSAGE: 'This message does not exist'
}

module.exports = { MASTER_ERRORS, WORKER_ERRORS }
