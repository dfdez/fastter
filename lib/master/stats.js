const { log } = require('../logger.js')

const workersStats = {
  passes: 0,
  pending: 0,
  failures: 0,
  workersFinished: 0
}
/**
 * @param {Object} stats New stats to add
 */
const addWorkersStats = (stats) => {
  workersStats.workersFinished++
  workersStats.passes = workersStats.passes + stats.passes
  workersStats.pending = workersStats.pending + stats.pending
  workersStats.failures = workersStats.failures + stats.failures
}

/**
 * Log current worker stats
 */
const logWorkerStats = () => {
  const { passes, pending, failures } = workersStats
  log(`Total test passing ${passes}`)
  log(`Total test pending ${pending}`)
  log(`Total test failures ${failures}`)
}

module.exports = { addWorkersStats, logWorkerStats }
