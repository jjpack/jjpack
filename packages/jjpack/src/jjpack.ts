import path from 'path'
import yargs from 'yargs'
import fkill from 'fkill'
import which from 'which'
import create from './create'
import info from './info'
// import start from './start'
// import build from './build'
import resolve from 'resolve'
import { fork, ChildProcess, ForkOptions } from 'child_process'
import updateNotifier from 'update-notifier'
import fs from 'fs-extra'
import { findRoot } from './utils'
import logger from './logger'
import chalk from 'chalk'
import { Plugin, Package } from './types'

export default class JJpack {
  // 当前执行路径
  public cwd: string
  // 命令行参数
  public argv: string[]
  // 环境变量
  public env: NodeJS.ProcessEnv
  // 是否是全局命令方式执行
  public isGlobal: boolean

  // 项目所在目录（项目package.json所在目录）
  public root: string
  // 项目package.json信息
  public pkg: Package

  // 命令名称
  private commands: Set<string>
  private subprocess: ChildProcess[]
  private plugins: Plugin[]

  constructor() {
    this.cwd = process.cwd()
    this.argv = process.argv.slice(2)
    this.env = process.env
    this.isGlobal = this.getIsGlobal()

    this.root = this.getRoot()
    this.pkg = this.resolvePackage()

    // 命令集合
    this.commands = new Set()
    this.subprocess = []
    this.plugins = this.resolvePlugins()

    this.plugins.forEach(plugin => this.use(plugin))

    const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM']

    /**
     * 主进程结束后同时也结束子进程
     */
    signals.forEach(signal => {
      /**
       * signal可用信号参数 http://nodejs.cn/api/process/signal_events.html
       * SIGTERM 和 SIGINT 在非windows平台绑定了默认的监听器，这样进程以代码128 + signal number结束之前，可以重置终端模式。
       * 如果这两个事件任意一个绑定了新的监听器，原有默认的行为会被移除(Node.js不会结束，需要手动结束)。
       * Note:
       *  Windows不支持发送信号
       *  但是Node.js通过process.kill() 和 subprocess.kill() 提供了某些模拟机制。
       *  发送信号0 可以测试进程是否存在
       *  发送SIGINT, SIGTERM, and SIGKILL 使得目标进程无条件终止。
       */
      process.on(signal, () => {
        this.subprocess.forEach(subprocess => {
          if (!subprocess.killed) {
            subprocess.kill(signal)
          }
        })
        process.exit(0)
      })
    })

    /**
     * 检查版本更新
     */
    updateNotifier({
      pkg: fs.readJSONSync(path.join(__dirname, '../package.json')),
      updateCheckInterval: 1000 * 60 * 60 // 每小时检查一次更新
    }).notify()
  }

  /**
   * 判断是否运行在全局模式
   */
  private getIsGlobal(): boolean {
    const jjpack = which.sync('jjpack', { nothrow: true })
    if (!jjpack) return false

    const pkgDir =
      process.platform !== 'win32'
        ? findRoot(fs.realpathSync(jjpack))
        : path.join(path.dirname(fs.realpathSync(jjpack)), './node_modules/@jjpack/cli')

    return __filename.startsWith(pkgDir)
  }

  private getRoot(): string {
    return findRoot(this.cwd)
  }

  /**
   * 加载cwd下的模块
   */
  public require<T>(id: string): T {
    const root = this.root || this.cwd
    try {
      return require(resolve.sync(id, { basedir: root }))
    } catch (err) {
      logger.error(`${root} 下没有找到模块 ${id}，请安装后再执行命令`)
      throw err
    }
  }

  /**
   * 子进程执行脚本
   * 和node `child_process`的 fork 一样使用
   * @param {String} path
   * @param  {String[]} argv
   * @param  {Object} options
   */
  public fork(path: string, argv?: string[], options?: ForkOptions): ChildProcess {
    const subprocess = fork(path, argv, {
      env: this.env, // 子进程继承当前环境的环境变量
      ...options
    })
    subprocess.on('close', () => {
      const index = this.subprocess.findIndex(item => item === subprocess)
      this.subprocess.splice(index, 1)
    })
    this.subprocess.push(subprocess)
    return subprocess
  }

  /**
   * 结束主进程
   * @param {Number} code
   */
  public exit(code?: number): void {
    fkill(
      this.subprocess.map(({ pid }) => pid),
      {
        tree: true,
        force: true
      }
    )
      .then(() => process.exit(code))
      .catch(() => process.exit(code))
  }

  /**
   * 获取package.json信息
   */
  private resolvePackage(): Package {
    const pkg = path.resolve(this.root || this.cwd, 'package.json')
    if (fs.existsSync(pkg)) {
      try {
        return require(pkg)
      } catch (e) {
        logger.error(`resolve ${pkg} fail`)
        return {}
      }
    }
    return {}
  }

  /**
   * 加载插件
   */
  private resolvePlugins(): Plugin[] {
    const { dependencies, devDependencies } = this.pkg

    /**
     * 读取package.json中的插件
     * 合并去除重复的npm包
     */
    return Object.keys({
      ...dependencies,
      ...devDependencies
    })
      .filter(name => /^@?jjpack[/-]cli-[a-z0-9-._~]+/.test(name))
      .reduce(
        (plugins, name) => {
          try {
            plugins.push(this.require(name) as Plugin)
          } catch (err) {
            logger.error(`plugin ${name} load fail`)
            throw err
          }
          return plugins
        },
        // [, lint, start, build, serve, inspect, info]
        [create, info] as Plugin[]
      )
  }

  /**
   * 使用插件
   * @param {Function} plugin
   */
  private use(plugin: Plugin): void {
    plugin(this)
  }

  /**
   * 注册命令
   * @param {String} name
   * @param  {...any} args
   */
  public register<T = unknown>(
    command: string,
    description: string,
    builder?: yargs.BuilderCallback<unknown, unknown>,
    handler?: (args: yargs.Arguments<T>) => void
  ): void {
    const name = command.split(/\s+/)[0]

    // 只能有数字、字母、下划线、冒号组成
    if (!/^[\w:]+$/.test(name)) {
      throw new Error(`命令名称 ${chalk.redBright(name)} 不合法，只能是字母、数字、下划线、冒号`)
    } else if (!description) {
      throw new Error('命令描述 description 不存在')
    } else if (this.commands.has(name)) {
      throw new Error(`命令 ${chalk.redBright(name)} 已经被占用`)
    }

    this.commands.add(name)

    yargs.command(command, description, builder, handler)
  }

  /**
   * 解析命令行参数
   * @param {Array} argv
   */
  public parse(argv: string[]): void {
    this.argv = argv
    if (this.argv.length) {
      yargs.parse(this.argv)
    } else {
      yargs.showHelp()
    }
  }
}
