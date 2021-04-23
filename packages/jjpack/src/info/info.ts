import envinfo from 'envinfo'
import logger from '../logger'

export default async (): Promise<void> => {
  const env = await envinfo.run(
    {
      System: ['OS', 'CPU', 'Memory'],
      Binaries: ['Node', 'Yarn', 'npm'],
      Browsers: ['Chrome', 'Edge', 'Firefox', 'Safari'],
      npmPackages: '@jjpack/*',
      npmGlobalPackages: '@jjpack/*'
    },
    {
      fullTree: true,
      duplicates: true,
      showNotFound: true
    }
  )
  logger.log(env)
}
