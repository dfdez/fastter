const MASTER_MESSAGES = require('./master.js')
const WORKER_MESSAGES = require('./worker.js')
const { MASTER_ERRORS, WORKER_ERRORS } = require('./errors.js')

module.exports = { MASTER_MESSAGES, WORKER_MESSAGES, MASTER_ERRORS, WORKER_ERRORS }
