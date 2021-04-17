const yaml = require('js-yaml')

class Frontmatter {
  extract (content) {
    const lines = content.split('\n')

    let text = null
    let properties = {}

    let start = lines.indexOf('---')
    if (start > -1) {
      start += 1
      const end = lines.indexOf('---', start)
      if (end > -1) {
        const section = lines.slice(start, end).join('\n')
        text = lines.slice(end + 1).join('\n')

        try {
          properties = yaml.load(section)
        } catch (error) {
          console.error(error)
        }
      }
    }

    if (text === null) {
      text = content
    }

    return {
      text,
      properties
    }
  }

  add (text, properties) {
    return [
      '---',
      yaml.dump(properties, { skipInvalid: true, lineWidth: -1 }).trim(),
      '---',
      text
    ].join('\n')
  }
}

module.exports = Frontmatter
