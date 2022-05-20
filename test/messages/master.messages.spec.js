import files from '../../lib/files/index.js'
import Stats from '../../lib/master/stats.js'
import Logger from '../../lib/logger.js'
import { MASTER_MESSAGES_RUN } from '../../messages'
import { MASTER_MESSAGES, WORKER_MESSAGES } from '../../constants'

beforeEach(() => {
  jest.clearAllMocks()
  jest.resetModules()
})

describe('Test sendLog master message function', () => {
  const spyLog = jest.spyOn(Logger, 'log').mockReturnValue()

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

describe('Test askForWork master message function', () => {
  const worker = {
    send: jest.fn()
  }
  const spyGetNextFile = jest.spyOn(files, 'getNextFile')

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

describe('Test registerTestCount master message function', () => {
  const spyAddWorkersStats = jest.spyOn(Stats, 'addWorkersStats')
  const spyLog = jest.spyOn(Logger, 'log').mockReturnValue()

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
    expect(spyLog).toHaveBeenCalled()
  })
})

describe('Test exitAllWorkers master message function', () => {
  it('should add stats and log error', () => {
    const spyAddWorkersStats = jest.spyOn(Stats, 'addWorkersStats')
    const spyLog = jest.spyOn(Logger, 'log').mockReturnValue()
    const exitAllWorkers = MASTER_MESSAGES_RUN[MASTER_MESSAGES.EXIT_ALL_WORKERS]

    const params = { stats: { passes: 1 }, error: ['Test error'] }
    exitAllWorkers(null, params)
    expect(spyAddWorkersStats).toHaveBeenCalledWith(params.stats)
    expect(spyLog).toHaveBeenCalledWith(params.error)
  })

  it('should send stop worker message to all workers with options and exit code', async () => {
    jest.resetModules()

    const mockSendMessage = jest.fn()
    jest.doMock('cluster', () => ({
      workers: {
        1: {
          send: mockSendMessage
        }
      }
    }))
    const { MASTER_MESSAGES_RUN } = await import('../../messages')
    const exitAllWorkers = MASTER_MESSAGES_RUN[MASTER_MESSAGES.EXIT_ALL_WORKERS]

    const params = { options: { _test: true }, exitCode: 1 }
    exitAllWorkers(null, params)
    expect(mockSendMessage).toHaveBeenCalledWith({ message: WORKER_MESSAGES.STOP_WORKER, data: { options: params.options, exitCode: params.exitCode } })
  })

  it('should do nothing if exitAllWorkers have already been called', async () => {
    jest.resetModules()

    const mockSendMessage = jest.fn()
    jest.doMock('cluster', () => ({
      workers: {
        1: {
          send: mockSendMessage
        }
      }
    }))
    const { MASTER_MESSAGES_RUN } = await import('../../messages')
    const exitAllWorkers = MASTER_MESSAGES_RUN[MASTER_MESSAGES.EXIT_ALL_WORKERS]

    exitAllWorkers(null, {})
    exitAllWorkers(null, {})
    expect(mockSendMessage).toHaveBeenCalledTimes(1)
  })
})
