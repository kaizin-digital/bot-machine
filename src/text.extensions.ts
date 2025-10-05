/**
 * A collection of common symbols and "eye-candy" strings for creating
 * visually appealing messages in Telegram, especially for SMM purposes.
 */
export const symbolTools = {
  // Bullets and Lists
  bullet: '•',
  dot: '·',
  star: '★',

  // Arrows
  arrow: '→',
  arrowRight: '➡️',
  arrowLeft: '⬅️',
  arrowUp: '⬆️',
  arrowDown: '⬇️',

  // Checkmarks and Crosses
  check: '✅',
  cross: '❌',
  checkboxOn: '☑️',
  checkboxOff: '🔲',

  // Emojis & Symbols
  warning: '⚠️',
  info: 'ℹ️',
  question: '❓',
  lightbulb: '💡',
  gem: '💎',
  rocket: '🚀',
  party: '🎉',
  money: '💰',
  gift: '🎁',

  // Separators
  hr: '\n──────────\n',
};

// We export the type to be able to merge it with the main Tools interface.
export type SymbolTools = typeof symbolTools;
