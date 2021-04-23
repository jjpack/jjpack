import path from 'path'
import fs from 'fs-extra'
import chalk from 'chalk'
import spinner from '../spinner'

export default async (template: string, name: string, targetDir: string): Promise<void> => {
  spinner.start('📦', `生成项目 ${chalk.yellow(name)}...`)
  const pkgPath = path.join(template, './package.json')
  const pkg = await fs.readJson(pkgPath)
  pkg.name = name
  await fs.writeJSON(pkgPath, pkg, { spaces: 2 })
  await fs.remove(path.join(template, './.git'))
  await fs.ensureDir(targetDir)
  await Promise.all(
    fs
      .readdirSync(template)
      .map(file => fs.move(path.join(template, file), path.join(targetDir, file), { overwrite: true }))
  )
  spinner.stop()
}
