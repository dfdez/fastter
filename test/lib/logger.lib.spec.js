const colors = {
  reset: '\x1b[0m',
  warning: '\x1b[93m',
  error: '\x1b[31m',
  grey: '\x1b[90m'
}

describe('Test colorize', () => {
  const { colorize } = require('../../lib/logger.js')

  it('should return original string if color does not exist', () => {
    const color = 'random'
    const originalString = 'Text colored'
    const colorizedString = colorize(color, originalString)

    expect(colorizedString).toBe(originalString)
  })

  it('should add color to string', () => {
    const color = 'warning'
    const originalString = 'Text colored'
    const colorizedString = colorize(color, originalString)
    const colorsInString = colorizedString.replace(originalString, ' ').split(' ')
    const stringInit = colorsInString[0]

    expect(stringInit).toBe(colors[color])
  })

  it('should reset the color at the end of the string', () => {
    const color = 'warning'
    const originalString = 'Text colored'
    const colorizedString = colorize(color, originalString)
    const colorsInString = colorizedString.replace(originalString, ' ').split(' ')
    const stringEnd = colorsInString[1]

    expect(stringEnd).toBe(colors.reset)
  })
})

describe('Test formatError', () => {
  const { formatError } = require('../../lib/logger.js')

  it('should make grey all lines less the first line of the stack', () => {
    const error = new Error()
    const originalStack = error.stack
    const originalStackArray = originalStack.split('\n')
    const formattedError = formatError(error)
    const formattedErrorArray = formattedError.split('\n')
    const firstMessageColors = formattedErrorArray[0].replace(originalStackArray[0], ' ').split(' ')

    expect(firstMessageColors[1]).toBe(colors.grey)
  })

  it('should make red first line of the stack', () => {
    const error = new Error()
    const originalStack = error.stack
    const originalStackArray = originalStack.split('\n')
    const formattedError = formatError(error)
    const formattedErrorArray = formattedError.split('\n')
    const firstMessageColors = formattedErrorArray[0].replace(originalStackArray[0], ' ').split(' ')

    expect(firstMessageColors[0]).toBe(colors.error)
  })

  it('should reset the color at the end of the string', () => {
    const error = new Error()
    const originalStack = error.stack
    const originalLastMessage = originalStack.split('\n').pop()
    const formattedError = formatError(error)
    const formattedLastMessage = formattedError.split('\n').pop()
    const lastMessageColors = formattedLastMessage.replace(originalLastMessage, ' ').split(' ')

    expect(lastMessageColors[1]).toBe(colors.reset)
  })
})

describe('Test log', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.resetModules()
  })

  const readline = require('readline')
  const spyStdout = jest.spyOn(process.stdout, 'write').mockReturnValue()
  const spyClearLine = jest.spyOn(readline, 'clearLine').mockReturnValue()
  const spySetInterval = jest.spyOn(global, 'setInterval').mockReturnValue()
  const spyClearInterval = jest.spyOn(global, 'clearInterval').mockReturnValue()
  const { log } = require('../../lib/logger.js')

  const spinner = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']

  it('should clear line and stdout message', () => {
    log('Testing')

    expect(spyClearLine).toHaveBeenCalled()
    expect(spyStdout).toHaveBeenCalled()
  })

  it('should format incoming message starting with \\r and end with \\n', () => {
    log('Testing')

    expect(spyStdout).toHaveBeenCalledWith('\rTesting\n')
  })

  it('should not add \\n when formatting message if newLine option is false ', () => {
    log('Testing', { newLine: false })

    expect(spyStdout).toHaveBeenCalledWith('\rTesting')
  })

  it('should format incoming message starting with \\r and adding \\n if messsage is an array', () => {
    log(['Testing', 'log'])

    expect(spyStdout).toHaveBeenCalledWith('\rTesting\nlog\n')
  })

  it('should add loader spinner to the string if loading or interval option is true', () => {
    spyClearLine.mockReturnValue()

    const logText = 'Testing'
    spinner.forEach((spin, index) => {
      log(logText, { loading: true })
      const spyStdoutCurrentCall = spyStdout.mock.calls[index]

      expect(spyStdoutCurrentCall[0]).toBe(`\r${spin} ${logText}`)
    })
  })

  it('should create interval with loading interval option and stdout formatted message', () => {
    const { log } = require('../../lib/logger.js')
    log('Testing', { loadingInterval: true })

    expect(spySetInterval).toHaveBeenCalled()

    const incomingIntervalFunction = spySetInterval.mock.calls[0][0]
    incomingIntervalFunction()

    expect(spyStdout).toHaveBeenCalledWith(`\r${spinner[0]} Testing`)
  })

  it('should only have one interval execution at the same time', () => {
    const { log } = require('../../lib/logger.js')
    log('Testing', { loadingInterval: true })
    log('Testing', { loadingInterval: true })

    expect(spySetInterval).toHaveBeenCalledTimes(1)
  })

  it('should clear interval if non interval message is received', () => {
    const interval = 'interval'
    spySetInterval.mockReturnValue(interval)

    const { log } = require('../../lib/logger.js')
    log('Testing', { loadingInterval: true })
    log('Testing')

    expect(spySetInterval).toHaveBeenCalledTimes(1)
    expect(spyClearInterval).toHaveBeenCalledTimes(1)
    expect(spyClearInterval).toHaveBeenCalledWith(interval)
  })
})
