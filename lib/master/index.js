import cluster from 'cluster'
import process from 'process'

import Stats from './stats.js'
import Options from '../options.js'
import Config from '../config.js'
import Logger from '../logger.js'

/**
 * Log worker stats, tests running time and exit
 * @param {number} exitCode Exit the process with a specific exit code
 */
const exitCluster = (exitCode) => {
  Stats.logWorkerStats()
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
    Stats.removeWorkerRunning()
    const currentWorkers = Stats.workersStats.workersRunning
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
const initMaster = async (options = Options.loadOptions()) => {
  console.time('Time running test')
  // Setup environment
  addExitEvents()
  const config = await Config.loadConfig(options._config)
  cluster.setupMaster({ silent: !options._debug })
  await config.beforeSetupWorkers({ options })

  Logger.log('Starting environments...', { loadingInterval: !options._min })
  for (let index = 0; index < options._workers; index++) {
    Stats.addWorkerRunning()
    cluster.fork(config.setupWorkerEnvironment({ options, worker: index }))
  }
}

export default { initMaster }
