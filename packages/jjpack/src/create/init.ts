import path from 'path'
import which from 'which'
import inquirer from 'inquirer'
import install from './install'
import initGit from './initGit'
import templates from './templates'
import cloneTemplate from './cloneTemplate'
import spinner from '../spinner'
import generateProject from './generateProject'
import chalk from 'chalk'
import fs from 'fs-extra'
import type { InitArgv } from './index'
import JJpack from '../jjpack'
import logger from '../logger'

async function init(cwd: string, argv: InitArgv): Promise<void> {
  const targetDir = path.join(cwd, argv.name)
  const name = argv.name === '.' ? path.relative('../', cwd) : argv.name

  /**
   * 目录存在的情况
   */
  if (fs.existsSync(targetDir)) {
    // 是否为当前目录
    if (targetDir === cwd) {
      const { ok } = await inquirer.prompt([
        {
          name: 'ok',
          type: 'confirm',
          message: '在当前目录生成项目?'
        }
      ])
      if (!ok) return
    } else {
      const { mode } = await inquirer.prompt([
        {
          name: 'mode',
          type: 'list',
          message: `目标目录 ${chalk.cyan(targetDir)} 已经存在. 请选择操作方式:`,
          choices: [
            { name: '覆盖', value: 'overwrite' },
            { name: '合并', value: 'merge' },
            { name: '取消', value: 'cancel' }
          ]
        }
      ])
      if (mode === 'cancel') {
        return
      } else if (mode === 'overwrite') {
        logger.log(`\n删除目录 ${chalk.cyan(targetDir)}...`)
        await fs.remove(targetDir)
      }
    }
  }

  /**
   * 选择模板
   */
  const { url } = await inquirer.prompt([
    {
      type: 'list',
      name: 'url',
      message: '请选择项目模板',
      choices: templates.map(({ name, url, descriptipon }) => ({
        name: `${descriptipon}(${name})`,
        value: url
      }))
    },
    {
      type: 'input',
      name: 'url',
      message: '请输入自定义模板地址',
      // 前面没有选择url时，执行本项
      when: answers => !answers.url,
      validate: input => {
        // 检测是否为git仓库地址
        const ssh = /^git@.+:.+\/.+\.git$/
        const https = /^https?:\/\/.+?\/.+\.git$/
        return !ssh.test(input) && !https.test(input) ? '请输入正确的模板仓库地址' : true
      }
    }
  ])
  if (!url) return

  const template = await cloneTemplate(url, cwd)
  await generateProject(template, name, targetDir)

  // 初始化git
  await initGit(targetDir)

  const pkgManager = which.sync('yarn', { nothrow: true }) ? 'yarn' : 'npm'
  await install(pkgManager, targetDir)

  logger.log(`\n🎉  成功初始化项目 ${chalk.yellow(name)}.`)
  logger.log('👉  使用下面的命令开始开发:\n')
  if (targetDir !== cwd) logger.log(chalk.cyan(` ${chalk.gray('$')} cd ${name}`))
  logger.log(chalk.cyan(` ${chalk.gray('$')} ${pkgManager} ${pkgManager === 'npm' ? 'run start' : 'start'}`))
}

export default (jjpack: JJpack, argv: InitArgv): void => {
  init(jjpack.cwd, argv)
    .then(() => spinner.stop(false))
    .catch(err => {
      spinner.stop(false)
      console.error(err)
      jjpack.exit(1)
    })
}
