import cluster from 'cluster'
import process from 'process'
import { WORKER_MESSAGES } from '../../constants/index.js'
import { workersStats, addWorkerRunning, removeWorkerRunning, logWorkerStats } from './stats.js'
import { loadOptions } from '../options.js'
import { loadConfig } from '../config.js'
import { log } from '../logger.js'
import { getNextFile } from '../files/index.js'

const exitCluster = (exitCode) => {
  logWorkerStats()
  console.timeEnd('Time running test')
  process.exit(exitCode)
}

const addExitEvents = () => {
  process.on('SIGTERM', () => exitCluster(1))
  process.on('SIGINT', () => exitCluster(1))

  cluster.on('exit', (_, exitCode) => {
    removeWorkerRunning()
    const currentWorkers = workersStats.workersRunning
    if (!currentWorkers) {
      exitCluster(exitCode)
    }
  })
}

const initMaster = async (options = loadOptions()) => {
  console.time('Time running test')
  addExitEvents()
  const config = loadConfig(options._config)
  cluster.setupPrimary({ silent: !options._debug })
  await config.beforeSetupWorkers({ options })

  log('Starting environments...', { loadingInterval: !options._min })
  for (let index = 0; index < options._workers; index++) {
    options._nextFile = getNextFile()
    if (options._nextFile) {
      addWorkerRunning()
      const worker = cluster.fork(config.setupWorkerEnvironment({ options, worker: index }))

      worker.send({
        message: WORKER_MESSAGES.PREPARE_TESTS,
        data: {
          options
        }
      })
    }
  }
}

export { initMaster }
