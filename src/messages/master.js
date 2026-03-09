import cluster from 'cluster'
import { MASTER_MESSAGES, WORKER_MESSAGES } from '../constants/index.js'
import { log } from '../lib/logger.js'
import { getNextFile, getTotalFiles } from '../lib/files/index.js'
import { workersStats, addWorkersStats } from '../lib/master/stats.js'

const sendLog = (_, { message, options }) => {
  return log(message, options)
}

const askForWork = (worker, { options }) => {
  const nextFile = getNextFile()
  if (nextFile) {
    options._nextFile = nextFile
    worker.send({ message: WORKER_MESSAGES.RUN_TEST, data: { options } })
  } else {
    worker.send({ message: WORKER_MESSAGES.STOP_WORKER, data: { options, exitCode: 0 } })
  }
}

let filesTested = 0

const registerTestCount = (_, { options, stats }) => {
  addWorkersStats(stats)
  const runningWorkers = workersStats.workersRunning
  const totalWorkers = options._workers
  log(`Running ${filesTested++}/${getTotalFiles()} test files in ${runningWorkers}/${totalWorkers} workers`, { loading: !options._min, newLine: false })
}

let exiting = false

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

const MASTER_MESSAGES_RUN = {
  [MASTER_MESSAGES.SEND_LOG]: sendLog,
  [MASTER_MESSAGES.ASK_FOR_WORK]: askForWork,
  [MASTER_MESSAGES.REGISTER_TEST_COUNT]: registerTestCount,
  [MASTER_MESSAGES.EXIT_ALL_WORKERS]: exitAllWorkers
}

export { MASTER_MESSAGES_RUN }
