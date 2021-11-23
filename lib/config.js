const path = require('path')

// Config options aviable
const config = {
  beforeSetupWorkers: () => {},
  setupWorkerEnvironment: () => {},
  prepareTest: () => {},
  beforeNextRun: () => {},
  runTest: () => {},
  stopTest: () => {}
}
/**
 * @param {String} configKey Config key to update
 * @param {Function} value Update config with incoming value
 */
const updateConfig = (configKey, value) => {
  if (!value) return
  if (typeof value === 'function' && config[configKey]) config[configKey] = value
}

/**
 * Get config file and replace config functions
 * @param {String} configFile Path with config file to load
 */
const loadConfig = (configFile) => {
  if (!configFile) return
  const _config = require(path.resolve(configFile))
  const configKeys = Object.keys(config)
  configKeys.forEach(configKey => {
    updateConfig(configKey, _config[configKey])
  })
  return config
}

module.exports = {
  loadConfig
}
