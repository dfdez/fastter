const yargs = require('yargs/yargs')
const { hideBin } = require('yargs/helpers')
const { cpus } = require('os')

const { MASTER_ERRORS } = require('../constants/errors.js')
const { collectFiles } = require('./files/index.js')
const { colorize } = require('./logger.js')

const cpuLength = cpus().length
const options = {
  config: {
    describe: 'Config file to use to run test',
    demandOption: true
  },
  'cpu-limit': {
    describe: `Set the number of CPUS to use \n ${colorize('grey', 'Env CPU_LIMIT will override this option')}`,
    default: cpuLength
  },
  debug: {
    describe: 'Show all logs instead of hidding workers logs'
  },
  min: {
    describe: 'Avoid spinner loading and unnecessary logs'
  }
}
/**
 * @returns Key value object with all loaded options
 * _${option} Are options used internally
 */
const loadOptions = () => {
  const loadedOptions = yargs(hideBin(process.argv))
    .options(options)
    .check(argv => {
      if (!argv._.length) throw new Error(MASTER_ERRORS.NO_FILES)
      if (!argv.config) throw new Error(MASTER_ERRORS.NO_CONFIG)
      return true
    })
    .help()
    .argv

  // Setup internal options to avoid conflicts
  Object.keys(options).forEach(optionKey => {
    const option = loadedOptions[optionKey]
    if (Array.isArray(option)) {
      loadedOptions[`_${optionKey}`] = option[0]
      loadedOptions[optionKey] = option[1]
    } else {
      loadedOptions[`_${optionKey}`] = option
      delete loadedOptions[optionKey]
    }
  })

  // Setup workers
  const { '_cpu-limit': optionsCpuLimit } = loadedOptions
  const cpuLimit = process.env.CPU_LIMIT || optionsCpuLimit
  const maxWorkers = cpuLength
  const limitWorkers = cpuLimit && cpuLimit > maxWorkers ? maxWorkers : cpuLimit
  loadedOptions._workers = limitWorkers || maxWorkers

  const files = collectFiles(loadedOptions._)
  loadedOptions._ = files
  return loadedOptions
}

module.exports = { loadOptions }
