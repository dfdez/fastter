import { MASTER_MESSAGES, WORKER_MESSAGES } from '../constants/index.js'
import { formatError } from '../lib/logger.js'
import { loadConfig } from '../lib/config.js'

const sendWorkerError = (worker, { options, error }) => {
  worker.send({
    message: MASTER_MESSAGES.EXIT_ALL_WORKERS,
    data: {
      options,
      exitCode: 1,
      error: error.formatted || formatError(error),
      stats: error.stats,
    },
  })
}

const prepareTest = async (worker, { options }) => {
  try {
    const config = loadConfig(options._config)
    await config.prepareTest({ options })
    await runTest(worker, { options })
  } catch (error) {
    sendWorkerError(worker, { options, error })
  }
}

const askForWork = async (worker, { options, config }) => {
  try {
    await config.beforeNextRun({ options })
    worker.send({ message: MASTER_MESSAGES.ASK_FOR_WORK, data: { options } })
  } catch (error) {
    sendWorkerError(worker, { options, error })
  }
}

const runTest = async (worker, { options }) => {
  try {
    const config = loadConfig(options._config)
    const testInfo = await config.runTest({ options })
    const { stats } = testInfo || {}
    worker.send({ message: MASTER_MESSAGES.REGISTER_TEST_COUNT, data: { options, stats } })
    await askForWork(worker, { options, config })
  } catch (error) {
    const { stats } = error
    sendWorkerError(worker, { options, stats, error })
  }
}

const stopWorker = async (worker, { options, exitCode }) => {
  try {
    const config = loadConfig(options._config)
    await config.stopTest({ options, exitCode })
    worker.disconnect()
    process.exit(exitCode)
  } catch (error) {
    sendWorkerError(worker, { options, error })
  }
}

const WORKER_MESSAGES_RUN = {
  [WORKER_MESSAGES.PREPARE_TESTS]: prepareTest,
  [WORKER_MESSAGES.RUN_TEST]: runTest,
  [WORKER_MESSAGES.STOP_WORKER]: stopWorker,
}

export { WORKER_MESSAGES_RUN }
