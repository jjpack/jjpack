import JJpack from '../jjpack'
import { BuildArgv } from './index'
import logger from '../logger'

/**
 * 使用子进程是为了修正webpack执行的时候的process.cwd
 * 如果不正确则可能出现打包错误
 */
export default (jjpack: JJpack, argv: BuildArgv) => {
  logger.log('🚀  正在打包,请稍等...')
}
