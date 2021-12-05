import constants from '../constants/index.js'
import Logger from '../lib/logger.js'
import Config from '../lib/config.js'

/**
 * Send error message to master
 * @param {Worker} worker Current worker
 * @param {Object} data Data in the message
 * @param {Object} data.options Current worker options
 * @param {Object} data.error The error to log
 */
const sendWorkerError = (worker, { options, error }) => {
  worker.send({
    message: constants.MASTER_MESSAGES.EXIT_ALL_WORKERS,
    data: {
      options,
      exitCode: 1,
      error: error.formatted || Logger.formatError(error),
      stats: error.stats
    }
  })
}

/**
 * Prepare test from config and execute runTest to start runTest askForWork loop
 * @param {Worker} worker Current worker
 * @param {Object} data Data in the message
 * @param {Object} data.options Current worker options
 */
const prepareTest = async (worker, { options }) => {
  try {
    const config = await Config.loadConfig(options._config)
    await config.prepareTest({ options })
    // Start runTest askForWork loop
    await runTest(worker, { options })
  } catch (error) {
    sendWorkerError(worker, { options, error })
  }
}

/**
 * Delete all information in DB and askForWork to master
 * @param {Worker} worker Current worker
 * @param {Object} params
 * @param {Object} params.options Current worker options
 * @param {Object} params.config Loaded config object
 */
const askForWork = async (worker, { options, config }) => {
  try {
    await config.beforeNextRun({ options })
    worker.send({ message: constants.MASTER_MESSAGES.ASK_FOR_WORK, data: { options } })
  } catch (error) {
    sendWorkerError(worker, { options, error })
  }
}

/**
 * Update current files with new options run test and ask for work when finish
 * @param {Worker} worker Current worker
 * @param {Object} data Data in the message
 * @param {Object} data.options Current worker options
 */
const runTest = async (worker, { options }) => {
  try {
    const config = await Config.loadConfig(options._config)
    const testInfo = await config.runTest({ options })
    const { stats } = testInfo || {}
    worker.send({ message: constants.MASTER_MESSAGES.REGISTER_TEST_COUNT, data: { options, stats } })
    await askForWork(worker, { options, config })
  } catch (error) {
    const { stats } = error
    sendWorkerError(worker, { options, stats, error })
  }
}

/**
 * Disconnect worker from cluster and exit worker process
 * @param {Worker} worker Current worker
 * @param {Object} data Data in the message
 * @param {Object} data.options Current worker options
 * @param {Object} data.exitCode The exit code to exit
 */
const stopWorker = async (worker, { options, exitCode }) => {
  try {
    const config = await Config.loadConfig(options._config)
    await config.stopTest({ options, exitCode })
    worker.disconnect()
    process.exit(exitCode)
  } catch (error) {
    sendWorkerError(worker, { options, error })
  }
}

// The function to execute for each message
// Each function will received the worker, and the data sended in the message
export default {
  [constants.WORKER_MESSAGES.PREPARE_TESTS]: prepareTest,
  [constants.WORKER_MESSAGES.RUN_TEST]: runTest,
  [constants.WORKER_MESSAGES.STOP_WORKER]: stopWorker
}
