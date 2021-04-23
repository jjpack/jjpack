declare module 'envinfo' {
  export function run(props: Record<string, string[] | string>, options: Record<string, unknown>): Promise<string>
}
