const cluster = require('cluster')
const process = require('process')

const { WORKER_MESSAGES } = require('../../constants')
const { addWorkerRunning, removeWorkerRunning, logWorkerStats, getWorkersRunning } = require('./stats.js')
const { loadOptions } = require('../options.js')
const { loadConfig } = require('../config.js')
const { log } = require('../logger.js')
const { getNextFile } = require('../files/index.js')

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
    const currentWorkers = getWorkersRunning()
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
  const config = loadConfig(options._config)
  cluster.setupMaster({ silent: !options._debug })
  await config.beforeSetupEnvironment({ options })

  log('Starting environments...', { loadingInterval: !options._min })
  for (let index = 0; index < options._workers; index++) {
    options._nextFile = getNextFile()
    if (options._nextFile) {
      addWorkerRunning()
      const worker = cluster.fork(config.setupEnvironment({ index, options }))

      worker.send({
        message: WORKER_MESSAGES.PREPARE_TESTS,
        data: {
          options
        }
      })
    }
  }
}

module.exports = { initMaster }
