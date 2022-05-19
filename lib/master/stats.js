import Logger from '../logger.js'
import Errors from '../errors.js'

const { MASTER_ERRORS } = Errors

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
  Logger.log(`Total test passing ${isNaN(passes) ? '?' : passes}`)
  Logger.log(`Total test pending ${isNaN(pending) ? '?' : pending}`)
  Logger.log(`Total test failures ${isNaN(failures) ? '?' : failures}`)
}

export default { workersStats, addWorkersStats, logWorkerStats, addWorkerRunning, removeWorkerRunning }
