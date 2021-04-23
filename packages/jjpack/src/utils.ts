import fs from 'fs'
import path from 'path'

export function findRoot(cwd = ''): string {
  const directory = path.resolve(cwd)
  const { root } = path.parse(directory)
  if (fs.existsSync(path.resolve(directory, 'package.json'))) {
    return directory
  } else {
    if (directory !== root) {
      return findRoot(path.dirname(directory))
    }
  }
  return root
}
