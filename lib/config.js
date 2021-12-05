import path from 'path'

// Config options aviable
const config = {
  beforeSetupWorkers: /* istanbul ignore next */ () => {},
  setupWorkerEnvironment: /* istanbul ignore next */ () => {},
  prepareTest: /* istanbul ignore next */ () => {},
  beforeNextRun: /* istanbul ignore next */ () => {},
  runTest: /* istanbul ignore next */ () => {},
  stopTest: /* istanbul ignore next */ () => {},
  _loaded: false
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
const loadConfig = async (configFile) => {
  if (!config._loaded) {
    if (!configFile) return
    const _config = await import(path.resolve(configFile))
    const configKeys = Object.keys(config)
    configKeys.forEach(configKey => {
      updateConfig(configKey, _config[configKey])
    })
    config._loaded = true
  }
  return config
}

export default  {
  loadConfig
}
