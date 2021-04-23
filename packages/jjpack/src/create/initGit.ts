import execa from 'execa'

export default async (cwd: string): Promise<void> => {
  await execa('git', ['init'], {
    cwd,
    stdio: ['inherit', 'ignore', 'ignore']
  })

  await execa('git', ['add', '--all'], {
    cwd,
    stdio: ['inherit', 'ignore', 'ignore']
  })

  await execa('git', ['commit', '-m', 'first commit'], {
    cwd,
    stdio: ['inherit', 'ignore', 'ignore']
  })
}
