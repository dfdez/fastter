vi.mock('../src/index.js', () => ({
  setupCluster: vi.fn()
}))

vi.mock('../src/lib/master/index.js', () => ({
  initMaster: vi.fn()
}))

vi.mock('../src/lib/options.js', () => ({
  loadOptions: vi.fn()
}))

it('should setup cluster, load options and init master with loaded options', async () => {
  const { setupCluster } = await import('../src/index.js')
  const { loadOptions } = await import('../src/lib/options.js')
  const { initMaster } = await import('../src/lib/master/index.js')

  const mockOptions = 'options'
  vi.mocked(loadOptions).mockReturnValue(mockOptions)

  await import('./index.js')

  expect(setupCluster).toHaveBeenCalled()
  expect(loadOptions).toHaveBeenCalled()
  expect(initMaster).toHaveBeenCalledWith(mockOptions)
})
