const { MASTER_MESSAGES, WORKER_MESSAGES } = require('../../constants')


beforeEach(() => {
  jest.resetAllMocks()
})

describe('Test sendLog', () => {
  jest.resetModules()

  const logger = require('../../lib/logger.js')
  const spyLog = jest.spyOn(logger, 'log').mockReturnValue()
  const { MASTER_MESSAGES_RUN } = require('../master.js')

  const sendLog = MASTER_MESSAGES_RUN[MASTER_MESSAGES.SEND_LOG]

  it('should send log to logger', () => {
    const testMessage = 'Testing logs'
    const options = {
      _test: true
    }
    sendLog(null, { message: testMessage, options })
    expect(spyLog).toHaveBeenCalledWith(testMessage, options)
  })
})

describe('Test askForWork', () => {
  jest.resetModules()

  const worker = {
    send: jest.fn()
  }
  const files = require('../../lib/files/index.js')
  const spyGetNextFile = jest.spyOn(files, 'getNextFile')
  const { MASTER_MESSAGES_RUN } = require('../master.js')

  const askForWork = MASTER_MESSAGES_RUN[MASTER_MESSAGES.ASK_FOR_WORK]

  it('should send run test message to worker if there is next file', () => {
    spyGetNextFile.mockReturnValue('test.spec.js')
    const options = {
      _test: true
    }
    askForWork(worker, { options })
    expect(spyGetNextFile).toHaveBeenCalled()
    expect(worker.send).toHaveBeenCalledWith({ message: WORKER_MESSAGES.RUN_TEST, data: { options } })
  })

  it('should send stop worker message if there isn\'t more files to run', () => {
    spyGetNextFile.mockReturnValue()
    const options = {
      _test: true
    }
    askForWork(worker, { options })
    expect(spyGetNextFile).toHaveBeenCalled()
    expect(worker.send).toHaveBeenCalledWith({ message: WORKER_MESSAGES.STOP_WORKER, data: { options, exitCode: 0 } })
  })
})

describe('Test registerTestCount', () => {
  jest.resetModules()

  const stats = require('../../lib/master/stats.js')
  const logger = require('../../lib/logger.js')
  const spyAddWorkersStats = jest.spyOn(stats, 'addWorkersStats')
  const spyGetWorkersRunning = jest.spyOn(stats, 'getWorkersRunning')
  const spyLog = jest.spyOn(logger, 'log').mockReturnValue()
  const { MASTER_MESSAGES_RUN } = require('../master.js')

  const registerTestCount = MASTER_MESSAGES_RUN[MASTER_MESSAGES.REGISTER_TEST_COUNT]

  it('should add worker stats and log status', () => {
    const stats = {
      passes: 1
    }
    const options = {
      _test: true
    }
    registerTestCount(null, { options, stats })
    expect(spyAddWorkersStats).toHaveBeenCalledWith(stats)
    expect(spyGetWorkersRunning).toHaveBeenCalled()
    expect(spyLog).toHaveBeenCalled()
  })
})

describe('Test exitAllWorkers', () => {
  jest.resetModules()

  const stats = require('../../lib/master/stats.js')
  const logger = require('../../lib/logger.js')
  const spyAddWorkersStats = jest.spyOn(stats, 'addWorkersStats')
  const spyLog = jest.spyOn(logger, 'log').mockReturnValue()
  const mockSendMessage = jest.fn()
  jest.doMock('cluster', () => ({
    workers: {
      '1': {
        send: mockSendMessage
      }
    }
  }))
  const { MASTER_MESSAGES_RUN } = require('../master.js')
  const exitAllWorkers = MASTER_MESSAGES_RUN[MASTER_MESSAGES.EXIT_ALL_WORKERS]

  it('should exit all workers and don\'t do nothing if already called', () => {
    const params = { stats: { passes: 1 }, options: { _test: true }, exitCode: 1, error: ['Test error'] }
    exitAllWorkers(null, params)
    // should add stats
    expect(spyAddWorkersStats).toHaveBeenCalledWith(params.stats)
    // should log error
    expect(spyLog).toHaveBeenCalledWith(params.error)
    // should send stop worker message to all workers
    expect(mockSendMessage).toHaveBeenCalledWith({ message: WORKER_MESSAGES.STOP_WORKER, data: { options: params.options, exitCode: params.exitCode } })

    // don't do nothing if exitAllWorkers have already been called
    exitAllWorkers(null, {})
    expect(spyAddWorkersStats).toHaveBeenCalledTimes(1)
    expect(spyLog).toHaveBeenCalledTimes(1)
    expect(mockSendMessage).toHaveBeenCalledTimes(1)
  })
})
