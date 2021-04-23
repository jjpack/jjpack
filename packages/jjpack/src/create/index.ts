import JJpack from '../jjpack'
import init from './init'

export interface InitArgv {
  name: string
}

export default (jjpack: JJpack): void => {
  jjpack.register<InitArgv>(
    'create <name>',
    '创建项目',
    yargs => {
      yargs.positional('name', {
        type: 'string',
        describe: '项目名称'
      })
    },
    argv => init(jjpack, argv)
  )
}
