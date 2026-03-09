import readline from 'readline'

const colors = {
  reset: '\x1b[0m',
  warning: '\x1b[93m',
  error: '\x1b[31m',
  grey: '\x1b[90m'
}

const colorize = (color, string) => {
  if (!colors[color]) return string
  return `${colors[color]}${string}${colors.reset}`
}

const spinner = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']
let spinnerCount = 0

const getLoadingMessage = () => {
  const loadingMessage = `${spinner[spinnerCount]}`
  spinnerCount++
  spinnerCount %= spinner.length
  return loadingMessage
}

const formatMessage = (message, { loading, loadingInterval, newLine }) => {
  if (message) {
    const isArray = Array.isArray(message)
    if (isArray) {
      let formattedMessage = '\r'
      message.forEach(msg => {
        formattedMessage = `${formattedMessage}${msg}\n`
      })
      return formattedMessage
    } else {
      if (loading || loadingInterval) {
        return `\r${getLoadingMessage()} ${message}`
      }
      if (!newLine) {
        return `\r${message}`
      }
      return `\r${message}\n`
    }
  }
}

const formatError = (error) => {
  const { stack } = error
  const message = stack.replace('\n', `${colors.grey}\n`)
  return `${colors.error}${message}${colors.reset}`
}

const makeLogs = (message) => {
  readline.clearLine(process.stdout, 0)
  process.stdout.write(message)
}

let currentIntervalMessage, isRunningInterval, currentLoadingInterval

const log = (message, options = {}) => {
  const { loading, loadingInterval, newLine = true } = options
  if (loadingInterval) {
    currentIntervalMessage = message
    if (!isRunningInterval) {
      currentLoadingInterval = setInterval(() => {
        makeLogs(formatMessage(currentIntervalMessage, { loading, loadingInterval, newLine }))
      }, 250)
      isRunningInterval = true
    }
  } else {
    if (isRunningInterval) {
      clearInterval(currentLoadingInterval)
      isRunningInterval = false
    }
    makeLogs(formatMessage(message, { loading, loadingInterval, newLine }))
  }
}

export { colorize, formatError, log }
