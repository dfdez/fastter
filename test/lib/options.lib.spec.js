
import { cpus } from 'os'
import { MASTER_ERRORS } from '../../lib/errors.js'

describe('Test loadOptions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.resetModules()
  })

  it('should throw error if missing path or files in arguments', async () => {
    const yargsLoadedOptions = {
      config: 'fastter.conf.js',
      'cpu-limit': 6,
      min: true,
      _: []
    }
    const yargsMock = jest.fn(() => {
      const yargsMock = {
        options: () => yargsMock,
        check: (checkFunction) => {
          expect(() => checkFunction(yargsLoadedOptions)).toThrow(new Error(MASTER_ERRORS.NO_FILES))
          return yargsMock
        },
        help: () => yargsMock,
        argv: yargsLoadedOptions
      }
      return yargsMock
    })

    jest.doMock('yargs', () => yargsMock)

    jest.doMock('../../lib/files/index.js', () => ({
      collectFiles: () => []
    }))
    const { loadOptions } = await import('../../lib/options.js')
    loadOptions()
  })

  it('should throw error if missing config in arguments', async () => {
    const yargsLoadedOptions = {
      'cpu-limit': 6,
      min: true,
      _: ['index.spec.js']
    }
    const yargsMock = jest.fn(() => {
      const yargsMock = {
        options: () => yargsMock,
        check: (checkFunction) => {
          expect(() => checkFunction(yargsLoadedOptions)).toThrow(new Error(MASTER_ERRORS.NO_CONFIG))
          return yargsMock
        },
        help: () => yargsMock,
        argv: yargsLoadedOptions
      }
      return yargsMock
    })

    jest.doMock('yargs', () => yargsMock)

    jest.doMock('../../lib/files/index.js', () => ({
      collectFiles: () => []
    }))
    const { loadOptions } = await import('../../lib/options.js')
    loadOptions()
  })

  it('should load options with yargs and return an object with all options', async () => {
    const yargsLoadedOptions = {
      config: 'fastter.conf.js',
      'cpu-limit': 6,
      min: true,
      _: ['index.spec.js']
    }
    const yargsMock = jest.fn(() => {
      const yargsMock = {
        options: () => yargsMock,
        check: (checkFunction) => {
          expect(checkFunction(yargsLoadedOptions)).toBe(true)
          return yargsMock
        },
        help: () => yargsMock,
        argv: yargsLoadedOptions
      }
      return yargsMock
    })

    jest.doMock('yargs', () => yargsMock)
    jest.doMock('../../lib/files/index.js', () => ({
      collectFiles: () => []
    }))

    const { loadOptions } = await import('../../lib/options.js')
    const loadedOptions = loadOptions()

    expect(yargsMock).toHaveBeenCalledTimes(1)
    expect(loadedOptions).toBe(yargsLoadedOptions)
  })

  it('should handle multiple options by adding _ to fastter options', async () => {
    const config = ['fastter.conf.js', 'mocha.conf.js']
    const yargsLoadedOptions = {
      config,
      'cpu-limit': 6,
      min: true,
      _: ['index.spec.js']
    }
    const yargsMock = jest.fn(() => {
      const yargsMock = {
        options: () => yargsMock,
        check: (checkFunction) => {
          expect(checkFunction(yargsLoadedOptions)).toBe(true)
          return yargsMock
        },
        help: () => yargsMock,
        argv: yargsLoadedOptions
      }
      return yargsMock
    })

    jest.doMock('yargs', () => yargsMock)
    jest.doMock('../../lib/files/index.js', () => ({
      collectFiles: () => []
    }))

    const { loadOptions } = await import('../../lib/options.js')
    const loadedOptions = loadOptions()

    expect(yargsMock).toHaveBeenCalledTimes(1)
    expect(loadedOptions).toBe(yargsLoadedOptions)
    expect(loadedOptions._config).toBe(config[0])
    expect(loadedOptions.config).toBe(config[1])
  })

  it('should return object with _ option with all files loaded', async () => {
    const yargsMock = jest.fn(() => {
      const yargsMock = {
        options: () => yargsMock,
        check: () => yargsMock,
        help: () => yargsMock,
        argv: {}
      }
      return yargsMock
    })

    jest.doMock('yargs', () => yargsMock)

    const filesCollectResult = ['index.spec.js', 'index.integration.js']
    const collectFilesMock = jest.fn(() => filesCollectResult)
    jest.doMock('../../lib/files/index.js', () => ({
      collectFiles: collectFilesMock
    }))

    const { loadOptions } = await import('../../lib/options.js')
    const loadedOptions = loadOptions()

    expect(loadedOptions._).toBe(filesCollectResult)
  })

  it('should return object with _workers option with the maximum amount of workers', async () => {
    const cpuLength = cpus().length

    const yargsMock = jest.fn(() => {
      const yargsMock = {
        options: () => yargsMock,
        check: () => yargsMock,
        help: () => yargsMock,
        argv: {}
      }
      return yargsMock
    })

    jest.doMock('yargs', () => yargsMock)
    jest.doMock('../../lib/files/index.js', () => ({
      collectFiles: () => []
    }))

    const { loadOptions } = await import('../../lib/options.js')
    const loadedOptions = loadOptions()

    expect(loadedOptions._workers).toBe(cpuLength)
  })

  it('should return object with _workers option with the cpu limit set on argv', async () => {
    const cpuLimit = '6'
    const yargsLoadedOptions = {
      'cpu-limit': cpuLimit
    }
    const yargsMock = jest.fn(() => {
      const yargsMock = {
        options: () => yargsMock,
        check: () => yargsMock,
        help: () => yargsMock,
        argv: yargsLoadedOptions
      }
      return yargsMock
    })

    jest.doMock('yargs', () => yargsMock)

    const { loadOptions } = await import('../../lib/options.js')
    const loadedOptions = loadOptions()

    expect(loadedOptions._workers).toBe(cpuLimit)
  })

  it('should return object with workers option with the cpu limit set on CPU_LIMIT environment who should have priority to argv', async () => {
    const CPU_LIMIT = '4'
    process.env.CPU_LIMIT = CPU_LIMIT

    const cpuLimit = '6'
    const yargsLoadedOptions = {
      'cpu-limit': cpuLimit
    }
    const yargsMock = jest.fn(() => {
      const yargsMock = {
        options: () => yargsMock,
        check: () => yargsMock,
        help: () => yargsMock,
        argv: yargsLoadedOptions
      }
      return yargsMock
    })

    jest.doMock('yargs', () => yargsMock)

    const { loadOptions } = await import('../../lib/options.js')
    const loadedOptions = loadOptions()

    expect(loadedOptions._workers).toBe(CPU_LIMIT)

    // Clean environment
    delete process.env.CPU_LIMIT
  })
})
