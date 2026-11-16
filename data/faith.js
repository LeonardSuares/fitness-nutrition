// ─────────────────────────────────────────────────────────────────────────────
// Faith content that is not a Bible verse: the saint for each month, the books
// of the Bible for the reading picker, and the RSV-2CE notice.
//
// Saint quotes: only words checked against a primary or official source
// (Vatican text, the Catechism). Where no such quote was found, `quote` is
// left out and only the saint and feast are shown. Add one from a book you
// trust, with its source, and it will appear.
// ─────────────────────────────────────────────────────────────────────────────

// One per month, January first.
export const SAINTS = [
  {
    name: 'Pope Francis',
    quote: 'The Lord does not disappoint those who take this risk; whenever we take a step towards Jesus, we come to realize that he is already there, waiting for us with open arms.',
    source: 'Evangelii Gaudium 3 (2013)',
  },
  {
    name: 'St. Thérèse of Lisieux', feast: 'October 1',
    quote: 'Love, in fact, is the vocation which includes all others',
    source: 'Story of a Soul, quoted in the Catechism, 826',
  },
  {
    name: 'St. Teresa of Avila', feast: 'October 15',
    quote: 'Let nothing trouble you / Let nothing frighten you / Everything passes / God never changes / Patience / Obtains all / Whoever has God / Wants for nothing / God alone is enough.',
    source: 'Poesías 30, quoted in the Catechism, 227',
  },
  {
    name: 'St. John Paul II', feast: 'October 22',
    quote: 'Do not be afraid. Open wide the doors for Christ.',
    source: 'Homily at the start of his pontificate, 22 October 1978',
  },
  {
    name: 'Pope Leo XIV', about: 'Elected 8 May 2025.',
    quote: 'Peace be with you all!',
    source: 'First words as Pope, 8 May 2025',
  },
  { name: 'St. Charbel Makhlouf', feast: 'July 24', about: 'Maronite monk and hermit of Lebanon.' },
  { name: 'St. Paisios of Mount Athos', feast: 'July 12', about: 'Monk of the Holy Mountain.' },
  { name: 'St. Teresa of Calcutta', feast: 'September 5', about: 'Founder of the Missionaries of Charity. Born 26 August 1910.' },
  {
    name: 'St. Padre Pio', feast: 'September 23',
    quote: 'Pray, hope, and don’t worry.',
    source: 'His well-known motto, as traditionally handed down',
  },
  {
    name: 'St. Francis of Assisi', feast: 'October 4',
    quote: 'May you be praised, O Lord, in all your creatures, especially brother sun, by whom you give us light for the day',
    source: 'Canticle of the Creatures, quoted in the Catechism, 344',
  },
  {
    name: 'St. Leo the Great', feast: 'November 10',
    quote: 'Christian, recognize your dignity …',
    source: 'Christmas sermon, quoted in the Catechism, 1691',
  },
  {
    name: 'St. John of the Cross', feast: 'December 14',
    quote: 'At the evening of life, we shall be judged on our love.',
    source: 'Dichos 64, quoted in the Catechism, 1022',
  },
];

// The books in the order of the Ignatius Bible, with chapter counts. Used
// only to estimate how far through the year's reading you are.
export const BOOKS = [
  ['Genesis', 50], ['Exodus', 40], ['Leviticus', 27], ['Numbers', 36], ['Deuteronomy', 34],
  ['Joshua', 24], ['Judges', 21], ['Ruth', 4], ['1 Samuel', 31], ['2 Samuel', 24],
  ['1 Kings', 22], ['2 Kings', 25], ['1 Chronicles', 29], ['2 Chronicles', 36], ['Ezra', 10],
  ['Nehemiah', 13], ['Tobit', 14], ['Judith', 16], ['Esther', 10], ['1 Maccabees', 16],
  ['2 Maccabees', 15], ['Job', 42], ['Psalms', 150], ['Proverbs', 31], ['Ecclesiastes', 12],
  ['Song of Solomon', 8], ['Wisdom', 19], ['Sirach', 51], ['Isaiah', 66], ['Jeremiah', 52],
  ['Lamentations', 5], ['Baruch', 6], ['Ezekiel', 48], ['Daniel', 14], ['Hosea', 14],
  ['Joel', 3], ['Amos', 9], ['Obadiah', 1], ['Jonah', 4], ['Micah', 7],
  ['Nahum', 3], ['Habakkuk', 3], ['Zephaniah', 3], ['Haggai', 2], ['Zechariah', 14],
  ['Malachi', 4],
  ['Matthew', 28], ['Mark', 16], ['Luke', 24], ['John', 21], ['Acts', 28],
  ['Romans', 16], ['1 Corinthians', 16], ['2 Corinthians', 13], ['Galatians', 6], ['Ephesians', 6],
  ['Philippians', 4], ['Colossians', 4], ['1 Thessalonians', 5], ['2 Thessalonians', 3], ['1 Timothy', 6],
  ['2 Timothy', 4], ['Titus', 3], ['Philemon', 1], ['Hebrews', 13], ['James', 5],
  ['1 Peter', 5], ['2 Peter', 3], ['1 John', 5], ['2 John', 1], ['3 John', 1],
  ['Jude', 1], ['Revelation', 22],
];
export const NT_START = 46;   // index of Matthew

// Required with any RSV-2CE quotation (wording from the copyright holder's
// licensing page). Up to 500 verses may be quoted without written permission.
export const RSV_NOTICE = 'Scripture quotations are from Revised Standard Version of the Bible—Second Catholic Edition (Ignatius Edition) Copyright © 2006 National Council of the Churches of Christ in the United States of America. Used by permission. All rights reserved worldwide.';
