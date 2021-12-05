import cluster from 'cluster'
import process from 'process'

import { WORKER_MESSAGES } from '../../constants/index.js'
import { workersStats, addWorkerRunning, removeWorkerRunning, logWorkerStats } from './stats.js'
import { loadOptions } from '../options.js'
import { loadConfig } from '../config.js'
import { log } from '../logger.js'
import { getNextFile } from '../files/index.js'

/**
 * Log worker stats, tests running time and exit
 * @param {number} exitCode Exit the process with a specific exit code
 */
const exitCluster = (exitCode) => {
  logWorkerStats()
  console.timeEnd('Time running test')
  process.exit(exitCode)
}

/**
 * Setup events to handle the script exits
 */
const addExitEvents = () => {
  // Execute exitCluster if SIGTERM or SIGINT
  process.on('SIGTERM', () => exitCluster(1))
  process.on('SIGINT', () => exitCluster(1))

  // Exit master cluster when all workers are done
  cluster.on('exit', (_, exitCode) => {
    removeWorkerRunning()
    const currentWorkers = workersStats.workersRunning
    // Only exit cluster if all workers are done
    if (!currentWorkers) {
      exitCluster(exitCode)
    }
  })
}

/**
 * Start master, init workers and start tests
 * @param {Object}} options Options to start the master
 */
const initMaster = async (options = loadOptions()) => {
  console.time('Time running test')
  // Setup environment
  addExitEvents()
  const config = await loadConfig(options._config)
  cluster.setupMaster({ silent: !options._debug })
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
      }, () => {
        console.log(':D')
      })
    }
  }
}

export default { initMaster }
