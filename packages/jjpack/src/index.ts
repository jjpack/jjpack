import JJpack from './jjpack'
import yargs from 'yargs'
import logger from './logger'

yargs
  .strict(true)
  .scriptName('jjpack')
  .usage('$0 <命令> [选项]')
  .alias('help', 'h')
  .alias('version', 'v')
  .wrap(null)
  .fail((msg, err, yargs) => {
    yargs.showHelp()
    logger.log()
    if (err) logger.error(msg)
    process.exit(1)
  })

const jjpack = new JJpack()

jjpack.parse(process.argv.slice(2))
