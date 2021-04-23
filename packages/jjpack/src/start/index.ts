import JJpack from '../jjpack'
import start from './start'

export interface StartArgv {
  mode: string
  open: string
  port: number
}

export default (jjpack: JJpack): void => {
  jjpack.register<StartArgv>(
    'start',
    '启动项目开发服务',
    yargs => {
      yargs
        .option('mode', {
          alias: 'm',
          type: 'string',
          requiresArg: true,
          describe: '加载 .env 环境变量文件'
        })
        .option('open', {
          alias: 'o',
          type: 'boolean',
          default: false,
          describe: '是否自动打开浏览器'
        })
        .option('port', {
          alias: 'p',
          type: 'number',
          default: 8080,
          requiresArg: true,
          describe: '指定 devServer 端口号'
        })
    },
    argv => {
      if (jjpack.isGlobal) {
        jjpack.require<typeof start>('@jjpack/cli/lib/start/start.js')(jjpack, argv)
      } else {
        start(jjpack, argv)
      }
    }
  )
}
