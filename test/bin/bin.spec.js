import cluster from 'cluster'
import index from '../../index.js'
import master from '../../lib/master'
import options from '../../lib/options.js'

it('should setup cluster, load options and init master with loaded options', async () => {
  const mockOptions = 'options'
  const spySetupCluster = jest.spyOn(index, 'setupCluster').mockReturnValue()
  const spyLoadOptions = jest.spyOn(options, 'loadOptions').mockReturnValue(mockOptions)
  const spyInitMaster = jest.spyOn(master, 'initMaster').mockReturnValue()
  await import('../../bin/index')
  expect(cluster.isMaster).toBe(true)
  expect(spySetupCluster).toHaveBeenCalled()
  expect(spyLoadOptions).toHaveBeenCalled()
  expect(spyInitMaster).toHaveBeenCalledWith(mockOptions)
})
