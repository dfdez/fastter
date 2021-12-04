const { MASTER_ERRORS } = require('../../../lib/errors.js')

describe('Test addWorkersStats', () => {
  beforeEach(() => {
    jest.resetModules()
  })
  it('should throw an error if argument is not defined', () => {
    const { addWorkersStats } = require('../../../lib/master/stats.js')

    expect(() => addWorkersStats()).toThrow(new Error(MASTER_ERRORS.NO_STATS))
  })

  it('should add new stats to workersStats object', () => {
    const { workersStats, addWorkersStats } = require('../../../lib/master/stats.js')

    const workersStatsData1 = {
      passes: 1,
      pending: 1,
      failures: 1
    }
    addWorkersStats(workersStatsData1)

    const workersStatsData2 = {
      passes: 2,
      pending: 1,
      failures: 3
    }
    addWorkersStats(workersStatsData2)

    expect(workersStats.passes).toBe(workersStatsData1.passes + workersStatsData2.passes)
    expect(workersStats.pending).toBe(workersStatsData1.pending + workersStatsData2.pending)
    expect(workersStats.failures).toBe(workersStatsData1.failures + workersStatsData2.failures)
  })
})

describe('Test logWorkerStats', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.resetModules()
  })

  it('should send log with test passing and failures', () => {
    const mockLogger = jest.fn()
    jest.doMock('../../../lib/logger.js', () => ({
      log: mockLogger
    }))
    const { workersStats, addWorkersStats, logWorkerStats } = require('../../../lib/master/stats.js')

    const workersStatsData = {
      passes: 1,
      pending: 1,
      failures: 1
    }
    addWorkersStats(workersStatsData)
    logWorkerStats()

    expect(mockLogger).toHaveBeenCalledTimes(3)
    expect(mockLogger).toHaveBeenCalledWith(`Total test passing ${workersStats.passes}`)
    expect(mockLogger).toHaveBeenCalledWith(`Total test pending ${workersStats.pending}`)
    expect(mockLogger).toHaveBeenCalledWith(`Total test failures ${workersStats.failures}`)
  })

  it('should send log with test passing and failures with ? if the stat is NaN', () => {
    const mockLogger = jest.fn()
    jest.doMock('../../../lib/logger.js', () => ({
      log: mockLogger
    }))
    const { addWorkersStats, logWorkerStats } = require('../../../lib/master/stats.js')

    const workersStatsData = {
      passes: NaN,
      pending: NaN,
      failures: NaN
    }
    addWorkersStats(workersStatsData)
    logWorkerStats()

    expect(mockLogger).toHaveBeenCalledTimes(3)
    expect(mockLogger).toHaveBeenCalledWith('Total test passing ?')
    expect(mockLogger).toHaveBeenCalledWith('Total test pending ?')
    expect(mockLogger).toHaveBeenCalledWith('Total test failures ?')
  })
})

describe('Test addWorkerRunning', () => {
  beforeEach(() => {
    jest.resetModules()
  })

  it('should add a new worker running to workers count', () => {
    const { workersStats, addWorkerRunning } = require('../../../lib/master/stats.js')
    addWorkerRunning()

    expect(workersStats.workersRunning).toBe(1)

    addWorkerRunning()

    expect(workersStats.workersRunning).toBe(2)
  })
})

describe('Test removeWorkerRunning', () => {
  beforeEach(() => {
    jest.resetModules()
  })

  it('should remove a worker running from wokers count', () => {
    const { workersStats, addWorkerRunning, removeWorkerRunning } = require('../../../lib/master/stats.js')
    const workersRunning = 3
    for (let i = 0; i < 3; i++) {
      addWorkerRunning()
    }
    removeWorkerRunning()

    expect(workersStats.workersRunning).toBe(workersRunning - 1)
  })
})
