import { MASTER_ERRORS } from '../../../lib/errors.js'

describe('Test addWorkersStats', () => {
  beforeEach(() => {
    jest.resetModules()
  })
  it('should throw an error if argument is not defined', async () => {
    const { addWorkersStats } = await import('../../../lib/master/stats.js')

    expect(() => addWorkersStats()).toThrow(new Error(MASTER_ERRORS.NO_STATS))
  })

  it('should add new stats to workersStats object', async () => {
    const { workersStats, addWorkersStats } = await import('../../../lib/master/stats.js')

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

  it('should send log with test passing and failures', async () => {
    const mockLogger = jest.fn()
    jest.doMock('../../../lib/logger.js', () => ({
      log: mockLogger
    }))
    const { workersStats, addWorkersStats, logWorkerStats } = await import('../../../lib/master/stats.js')

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

  it('should send log with test passing and failures with ? if the stat is NaN', async () => {
    const mockLogger = jest.fn()
    jest.doMock('../../../lib/logger.js', () => ({
      log: mockLogger
    }))
    const { addWorkersStats, logWorkerStats } = await import('../../../lib/master/stats.js')

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

  it('should add a new worker running to workers count', async () => {
    const { workersStats, addWorkerRunning } = await import('../../../lib/master/stats.js')
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

  it('should remove a worker running from wokers count', async () => {
    const { workersStats, addWorkerRunning, removeWorkerRunning } = await import('../../../lib/master/stats.js')
    const workersRunning = 3
    for (let i = 0; i < 3; i++) {
      addWorkerRunning()
    }
    removeWorkerRunning()

    expect(workersStats.workersRunning).toBe(workersRunning - 1)
  })
})
