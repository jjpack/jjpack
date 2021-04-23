import JJpack from '../jjpack'
import build from './build'

export interface BuildArgv {
  mode: string
  report: string
  sourcemap: string
}

export default (jjpack: JJpack): void => {
  jjpack.register<BuildArgv>(
    'build',
    '打包项目文件',
    yargs => {
      yargs
        .option('mode', {
          alias: 'm',
          type: 'string',
          requiresArg: true,
          describe: '加载 .env 环境变量文件'
        })
        .option('report', {
          alias: 'r',
          describe: '生成打包报告文件，可指定文件名'
        })
        .option('sourcemap', {
          alias: 's',
          type: 'boolean',
          default: false,
          describe: '是否生成source map'
        })
    },
    argv => {
      if (jjpack.isGlobal) {
        jjpack.require<typeof build>('@jjpack/cli/lib/build/build.js')(jjpack, argv)
      } else {
        build(jjpack, argv)
      }
    }
  )
}
