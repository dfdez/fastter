const cluster = require('cluster')
const index = require('../../index.js')
const master = require('../../lib/master')
const options = require('../../lib/options.js')

it('should setup cluster, load options and init master with loaded options', () => {
  const mockOptions = 'options'
  const spySetupCluster = jest.spyOn(index, 'setupCluster').mockReturnValue()
  const spyLoadOptions = jest.spyOn(options, 'loadOptions').mockReturnValue(mockOptions)
  const spyInitMaster = jest.spyOn(master, 'initMaster').mockReturnValue()
  require('../index')
  expect(cluster.isMaster).toBe(true)
  expect(spySetupCluster).toHaveBeenCalled()
  expect(spyLoadOptions).toHaveBeenCalled()
  expect(spyInitMaster).toHaveBeenCalledWith(mockOptions)
})
