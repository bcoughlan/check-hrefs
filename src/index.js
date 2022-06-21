
const fs = require('fs/promises')
const path = require('path')

async function checkLinks(dir) {
  for await (const file of walk(dir, ['htm', 'html'])) {
    const content = await fs.readFile(file, 'utf8')
    const links = content.match(/href="([^"]+?)"/g)
    if (links) {
      for (const link of links) {
        const href = link.match(/"([^"]+)"/)[1]
          .split('#')[0] // remove anchor

        if (href.toLowerCase().startsWith('javascript:')) {
          continue
        }

        const isRelative = !href.includes('://')
        if (isRelative) {
          if (!await fileExists(path.join(path.dirname(file), href))) {
            console.log(`Invalid link: ${file}: ${href}`)
          }
        }
      }
    }
  }
}

async function* walk(dir, extensions) {
  for await (const d of await fs.opendir(dir)) {
    const entry = path.join(dir, d.name)
    if (d.isDirectory())
      yield* walk(entry, extensions)
    else if (d.isFile() && (!extensions || extensions.includes(path.extname(entry).slice(1)))) {
      yield entry
    }
  }
}

async function fileExists(path) {
  try {
    await fs.stat(path)
    return true
  } catch (err) {
    return false
  }
}

async function main() {
  await checkLinks(process.argv[2])
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})