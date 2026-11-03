export function supportOwnerReplyText(body: string) {
  return body
    .split(/\n(?:On .+wrote:|From:\s*PhotoView\.io Support|-----Original Message-----)\s*/i, 1)[0]
    .split("\n")
    .filter((line) => !/^\s*>/.test(line))
    .join("\n")
    .trim()
    .slice(0, 12_000)
}
