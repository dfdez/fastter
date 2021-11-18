const readline = require('readline')

const colors = {
  reset: '\x1b[0m',
  warning: '\x1b[93m',
  error: '\x1b[31m',
  grey: '\x1b[90m'
}
/**
 * @param {String} color Color to use
 * @param {String} string String to format
 * @returns String formatted with color
 */
const colorize = (color, string) => {
  if (!colors[color]) return string
  return `${colors[color]}${string}${colors.reset}`
}

const spinner = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']
let spinnerCount = 0
/**
 * Return the current loading spinner string
 * @returns {string} String with current loading spinner string
 */
const getLoadingMessage = () => {
  const loadingMessage = `${spinner[spinnerCount]}`
  spinnerCount++
  spinnerCount %= spinner.length
  return loadingMessage
}

/**
 * Format the message to be sended to stdout
 * @param {string} message The string with the message to log
 * @param {Object} options The message format options
 * @param {boolean} options.loading If should so the loading spinner
 * @param {boolean} options.interval By default is true set to false if don't want to create an interval loading
 * @returns String formatted depending on options
 */
const formatMessage = (message, { loading, interval }) => {
  if (message) {
    const isArray = Array.isArray(message)
    if (isArray) {
      let formattedMessage = '\r'
      message.forEach(msg => {
        formattedMessage = `${formattedMessage}${msg}\n`
      })
      return formattedMessage
    } else {
      if (loading) {
        return `\r${getLoadingMessage()} ${message}`
      } else if (!interval) {
        return `\r${message}`
      }
      return `\r${message}\n`
    }
  }
}

/**
 * @param {Error} error
 * @returns The error stack string colorized
 */
const formatError = (error) => {
  const { stack } = error
  const message = stack.replace('\n', `${colors.grey}\n`)
  return `${colors.error}${message}${colors.reset}`
}

/**
 * Send message to stdout
 * @param {string} message Message to send to process.stdout.write
 */
const makeLogs = (message) => {
  readline.clearLine(process.stdout, 0)
  process.stdout.write(message)
}

let currentIntervalMessage, isRunningInterval, loadingInterval
/**
 * Send message to logs
 * @param {string} message Message to send to logs
 * @param {Object} options The message format options
 * @param {boolean} options.loading If should so the loading spinner
 * @param {boolean} options.interval By default is true set to false if don't want to create an interval loading
 */
const log = (message, options = {}) => {
  const { loading, interval = true } = options
  if (loading && interval) {
    currentIntervalMessage = message
    if (!isRunningInterval) {
      loadingInterval = setInterval(() => {
        makeLogs(formatMessage(currentIntervalMessage, { loading, interval }))
      }, 250)
      isRunningInterval = true
    }
  } else {
    if (isRunningInterval) {
      clearInterval(loadingInterval)
      isRunningInterval = false
    }
    makeLogs(formatMessage(message, { loading, interval }))
  }
}

module.exports = { colorize, formatError, log }
