import readline from 'readline'
import execa from 'execa'
import chalk from 'chalk'
import logger from '../logger'

/**
 * 渲染进度条
 * @param {*} curr
 * @param {*} total
 */
function renderProgressBar(current: string, totalp: string) {
  const curr = Number(current)
  const total = Number(totalp)
  const ratio = Math.min(Math.max(curr / total, 0), 1)
  const bar = ` ${curr}/${total}`
  const availableSpace = Math.max(0, process.stderr.columns - bar.length - 3)
  const width = Math.min(total, availableSpace)
  const completeLength = Math.round(width * ratio)
  const complete = '#'.repeat(completeLength)
  const incomplete = '-'.repeat(width - completeLength)
  if (!chalk.supportsColor) {
    process.stderr.write('\r')
    return
  }
  readline.cursorTo(process.stderr, 0)
  process.stderr.write(`[${complete}${incomplete}]${bar}`)
}

export default (pkgManager: string, cwd: string): Promise<void> => {
  const args = pkgManager === 'npm' ? ['install', '--loglevel', 'error'] : ['install']

  const cmd = `${pkgManager} ${args.join(' ')}`
  logger.log(`🚀  安装项目依赖 ${chalk.cyan(cmd)}，请稍等...`)

  return new Promise((resolve, reject) => {
    const child = execa(pkgManager, args, {
      cwd,
      stdio: ['inherit', 'inherit', pkgManager === 'yarn' ? 'pipe' : 'inherit']
    })

    // filter out unwanted yarn output
    if (pkgManager === 'yarn') {
      child.stderr?.on('data', (buf: Buffer) => {
        const str = buf.toString()
        if (/warning/.test(str)) return
        // progress bar
        const progressBarMatch = str.match(/\[.*\] (\d+)\/(\d+)/)
        // since yarn is in a child process, it's unable to get the width of
        // the terminal. reimplement the progress bar ourselves!
        if (progressBarMatch) return renderProgressBar(progressBarMatch[1], progressBarMatch[2])
        process.stderr.write(buf)
      })
    }

    child.then(() => resolve()).catch(() => reject(new Error(`依赖安装失败: ${cmd}`)))
  })
}
