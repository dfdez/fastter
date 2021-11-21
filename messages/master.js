const cluster = require('cluster')
const { MASTER_MESSAGES, WORKER_MESSAGES } = require('../constants')
const { log } = require('../lib/logger.js')
const { getNextFile, getTotalFiles } = require('../lib/files/index.js')
const { addWorkersStats, getWorkersRunning } = require('../lib/master/stats.js')

/**
 * Send a log from a worker
 * @param {Worker} _ Worker who sent the message
 * @param {Object} data Data in the message
 * @param {Object} data.message Message to send
 * @param {Object} data.options Options of the message to send
 */
const sendLog = (_, { message, options }) => {
  return log(message, options)
}

/**
 * Ask to master for work by looking for pending files
 * @param {Worker} worker Worker who sent the message
 * @param {Object} options Options sended by the worker
 */
const askForWork = (worker, { options }) => {
  const nextFile = getNextFile()
  if (nextFile) {
    // Set the new file to test
    options._nextFile = nextFile
    // Send work to the worker
    worker.send({ message: WORKER_MESSAGES.RUN_TEST, data: { options } })
  } else {
    // Stop the worker since there is nothing to do
    worker.send({ message: WORKER_MESSAGES.STOP_WORKER, data: { options, exitCode: 0 } })
  }
}

let filesTested = 0
/**
 * Register the test stats in genericWorkerStats object
 * @param {Worker} _ Worker who sent the message
 * @param {Object} data Data in the message
 * @param {Object} data.options Options sended by the worker
 * @param {Object} data.stats Worker stats
 */
const registerTestCount = (_, { options, stats }) => {
  addWorkersStats(stats)
  const runningWorkers = getWorkersRunning()
  const totalWorkers = options._workers
  log(`Running ${filesTested++}/${getTotalFiles()} test files in ${runningWorkers}/${totalWorkers} workers`, { loading: !options._min, newLine: false })
}

let exiting = false
/**
 * Exit all workers and send the error to logs
 * @param {Worker} _ Worker who sent the message
 * @param {Object} data Data in the message
 * @param {Object} data.options Options sended by the worker
 * @param {Object} data.stats Worker stats
 * @param {number} data.exitCode Exit code to use
 * @param {Object} data.error Error message to send
 */
const exitAllWorkers = (_, { options, stats = {}, exitCode = 0, error = [] }) => {
  if (!exiting) {
    exiting = true

    addWorkersStats(stats)
    log(error)

    const workersIds = Object.keys(cluster.workers)
    workersIds.forEach(id => {
      const worker = cluster.workers[id]
      worker.send({ message: WORKER_MESSAGES.STOP_WORKER, data: { options, exitCode } })
    })
  }
}

// The function to execute for each message
// Each function will received the worker, and the data sended in the message
const MASTER_MESSAGES_RUN = {
  [MASTER_MESSAGES.SEND_LOG]: sendLog,
  [MASTER_MESSAGES.ASK_FOR_WORK]: askForWork,
  [MASTER_MESSAGES.REGISTER_TEST_COUNT]: registerTestCount,
  [MASTER_MESSAGES.EXIT_ALL_WORKERS]: exitAllWorkers
}

module.exports = { MASTER_MESSAGES_RUN }
