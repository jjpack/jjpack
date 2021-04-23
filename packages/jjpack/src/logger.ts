import chalk from 'chalk'

export default {
  log(msg = ''): void {
    return console.log(msg)
  },
  done(msg = ''): void {
    return console.log(`${chalk.bgGreen.black(' DONE ')} ${msg}`)
  },
  warn(msg = ''): void {
    return console.warn(`${chalk.bgYellow.black(' WARN ')} ${chalk.yellow(msg)}`)
  },
  error(msg = ''): void {
    return console.error(`${chalk.bgRed(' ERROR ')} ${chalk.red(msg)}`)
  }
}
