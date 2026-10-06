// Turns dist/index.html into dist/preview.html: the page body only (no doctype/html/head/body
// wrappers), which is the shape the claude.ai preview page expects.
import { readFileSync, writeFileSync, readdirSync } from 'node:fs'

const html = readFileSync('dist/index.html', 'utf8')
const head = html.match(/<head>([\s\S]*?)<\/head>/)[1]
const body = html.match(/<body>([\s\S]*?)<\/body>/)[1]
const keep = head
  .split('\n')
  .filter((l) => !/<meta (charset|name="viewport")/i.test(l))
  .join('\n')
const scripts = keep.match(/<script[\s\S]*?<\/script>/g) ?? []
const rest = keep.replace(/<script[\s\S]*?<\/script>/g, '')
writeFileSync('dist/preview.html', `${rest.trim()}\n${body.trim()}\n${scripts.join('\n')}\n`)
console.log('assets:', readdirSync('dist/assets').join(', '))
