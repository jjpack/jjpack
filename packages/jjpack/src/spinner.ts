import ora from 'ora'
import chalk from 'chalk'

interface ILastMsg {
  symbol: string
  text: string
}

const spinner = ora()
let lastMsg: ILastMsg | null = null

const start = (symbol: string, msg: string): void => {
  if (!msg) {
    msg = symbol
    symbol = chalk.green('🍺')
  }
  if (lastMsg) {
    spinner.stopAndPersist({
      symbol: lastMsg.symbol,
      text: lastMsg.text
    })
  }
  spinner.text = ' ' + msg
  lastMsg = {
    symbol: symbol + ' ',
    text: msg
  }
  spinner.start()
}

const stop = (persist?: boolean): void => {
  if (lastMsg && persist !== false) {
    spinner.stopAndPersist({
      symbol: lastMsg.symbol,
      text: lastMsg.text
    })
  } else {
    spinner.stop()
  }
  lastMsg = null
}

const resume = (): void => {
  spinner.start()
}

const pause = (): void => {
  spinner.stop()
}

export default {
  start,
  stop,
  resume,
  pause
}
