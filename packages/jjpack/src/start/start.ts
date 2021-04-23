import JJpack from '../jjpack'
import logger from '../logger'
import type { StartArgv } from './index'

/**
 * 使用子进程是为了修正webpack执行的时候的process.cwd
 * 如果不正确则可能出现编译错误
 */
export default (jjpack: JJpack, argv: StartArgv): void => {
  logger.log('📦  正在启动开发服务,请稍等...')
}
