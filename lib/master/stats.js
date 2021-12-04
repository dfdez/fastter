const { MASTER_ERRORS } = require('../errors.js')
const { log } = require('../logger.js')

const workersStats = {
  passes: 0,
  pending: 0,
  failures: 0,
  workersRunning: 0
}
/**
 * @param {Object} stats New stats to add
 */
const addWorkersStats = (stats) => {
  if (!stats) throw new Error(MASTER_ERRORS.NO_STATS)
  workersStats.passes = workersStats.passes + stats.passes
  workersStats.pending = workersStats.pending + stats.pending
  workersStats.failures = workersStats.failures + stats.failures
}

const addWorkerRunning = () => {
  return workersStats.workersRunning++
}

const removeWorkerRunning = () => {
  return workersStats.workersRunning--
}

const logWorkerStats = () => {
  const { passes, pending, failures } = workersStats
  log(`Total test passing ${isNaN(passes) ? '?' : passes}`)
  log(`Total test pending ${isNaN(pending) ? '?' : pending}`)
  log(`Total test failures ${isNaN(failures) ? '?' : failures}`)
}

module.exports = { workersStats, addWorkersStats, logWorkerStats, addWorkerRunning, removeWorkerRunning }
