import os from 'os'
import path from 'path'
import chalk from 'chalk'
import fs from 'fs-extra'
import execa from 'execa'
import spinner from '../spinner'

export default async (template: string, cwd: string): Promise<string> => {
  spinner.start('✨', `克隆模板 ${chalk.yellow(template)}...`)
  const tmpdir = path.join(os.tmpdir(), 'jjpack')
  await fs.remove(tmpdir)

  await execa('git', ['clone', '--depth', '1', template, tmpdir], {
    cwd,
    stdio: ['inherit', 'ignore', 'ignore']
  })

  spinner.stop()

  return tmpdir
}
