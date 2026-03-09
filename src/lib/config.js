import path from 'path'

const defaultLoader = (filePath) => import(filePath)

const config = {
  beforeSetupWorkers: /* istanbul ignore next */ () => {},
  setupWorkerEnvironment: /* istanbul ignore next */ () => {},
  prepareTest: /* istanbul ignore next */ () => {},
  beforeNextRun: /* istanbul ignore next */ () => {},
  runTest: /* istanbul ignore next */ () => {},
  stopTest: /* istanbul ignore next */ () => {},
  _loaded: false,
}

const updateConfig = (configKey, value) => {
  if (!value) return
  if (typeof value === 'function' && config[configKey]) config[configKey] = value
}

/**
 * Get config file and replace config functions
 * @param {String} configFile Path with config file to load
 * @param {Function} loader Module loader function (defaults to dynamic import; injectable for testing)
 */
const loadConfig = async (configFile, loader = defaultLoader) => {
  if (!config._loaded) {
    if (!configFile) return
    const module = await loader(path.resolve(configFile))
    const _config = module.default
    const configKeys = Object.keys(config)
    configKeys.forEach((configKey) => {
      updateConfig(configKey, _config[configKey])
    })
    config._loaded = true
  }
  return config
}

export { loadConfig }
