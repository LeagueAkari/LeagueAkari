const fs = require('node:fs')
const path = require('node:path')
const { execFileSync } = require('node:child_process')

const packageRoot = path.resolve(__dirname, '..')

if (fs.existsSync(path.join(packageRoot, 'build'))) {
  fs.rmSync(path.join(packageRoot, 'build'), { recursive: true })
}

if (fs.existsSync(path.join(packageRoot, 'addons'))) {
  fs.rmSync(path.join(packageRoot, 'addons'), { recursive: true })
}

if (fs.existsSync(path.join(packageRoot, 'dist'))) {
  fs.rmSync(path.join(packageRoot, 'dist'), { recursive: true })
}

if (fs.existsSync(path.join(packageRoot, 'tsconfig.tsbuildinfo'))) {
  fs.rmSync(path.join(packageRoot, 'tsconfig.tsbuildinfo'))
}

// c++ build
execFileSync(process.execPath, [require.resolve('node-gyp/bin/node-gyp.js'), 'rebuild'], {
  cwd: packageRoot,
  stdio: 'inherit'
})

const files = fs.readdirSync(path.join(packageRoot, 'build/Release'))

if (!fs.existsSync(path.join(packageRoot, 'addons'))) {
  fs.mkdirSync(path.join(packageRoot, 'addons'))
}

for (const file of files) {
  if (!file.endsWith('.node')) {
    continue
  }

  fs.copyFileSync(
    path.join(packageRoot, 'build/Release', file),
    path.join(packageRoot, 'addons', file)
  )
}

// typescript build
execFileSync(process.execPath, [require.resolve('typescript/bin/tsc'), '-p', 'tsconfig.json'], {
  cwd: packageRoot,
  stdio: 'inherit'
})
