import fs from 'fs'
import path from 'path'

const PLUGIN_NAME = 'WebpackDelFilePlugin'
const DEFAULT_DELETE_REGEX = /\.map$/

module.exports = class SentryPlugin {
  constructor(options) {
    this.deleteRegex = options.deleteRegex || DEFAULT_DELETE_REGEX
  }

  apply(compiler) {
    compiler.hooks.done.tapPromise(PLUGIN_NAME, async (stats) => {
      await this.deleteFiles(stats)
    })
  }

  // eslint-disable-next-line class-methods-use-this
  getAssetPath(compilation, name) {
    return path.join(
      compilation.getPath(compilation.compiler.outputPath),
      name.split('?')[0]
    )
  }

  async deleteFiles(stats) {
    Object.keys(stats.compilation.assets)
      .filter(name => this.deleteRegex.test(name))
      .forEach((name) => {
        const filePath = this.getAssetPath(stats.compilation, name)
        if (filePath) {
          fs.unlinkSync(filePath)
        }
        else {
          // eslint-disable-next-line no-console
          console.warn(
            `${PLUGIN_NAME}: unable to delete '${name}'. ` +
              'File does not exist; it may not have been created ' +
              'due to a build error.'
          )
        }
      })
  }
}
