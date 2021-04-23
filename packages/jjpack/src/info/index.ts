import type JJpack from '../jjpack'
import info from './info'

export default (jjpack: JJpack): void => {
  jjpack.register('info', '查看系统环境信息', () => info())
}
