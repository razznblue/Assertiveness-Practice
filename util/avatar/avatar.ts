import { Style, Avatar } from '@dicebear/core';
import avataaars from '@dicebear/styles/avataaars.json' with { type: 'json' };

import words from './words';

// Chosen Dicebear Style Set for the app. (Can change or support more styles later)
const style = new Style(avataaars);

const generateAvatarSeed = (topics: string[] = []) => {
  const randomString = (length = 6) =>
    Array.from({ length }, () =>
      'abcdefghijklmnopqrstuvwxyz0123456789'[
        Math.floor(Math.random() * 36)
      ]
    ).join('')

  const randomItem = <T,>(items: T[]): T =>
    items[Math.floor(Math.random() * items.length)]

  const randomWord = () => randomItem(words)

  // Add a random database topic to the available seed options
  const randomTopic = topics.length ? randomItem(topics) : randomWord()

  // Defines formats or different possibilities for generating the avatar seed
  const formats: (() => string)[] = [
    // Single words
    () => randomWord(),
    () => randomTopic,

    // Numbers only
    () => String(Math.floor(Math.random() * 1_000_000_000)),
    () => String(Math.floor(Math.random() * 10000)),

    // Random letters and numbers
    () => randomString(6),
    () => randomString(10),
    () => randomString(16),

    // Word combinations
    () => `${randomWord()}-${randomWord()}`,
    () => `${randomWord()}${randomWord()}`,

    // Words and numbers
    () => `${randomWord()}${Math.floor(Math.random() * 10000)}`,
    () => `${randomTopic}${Math.floor(Math.random() * 1000)}`,

    // Mixed combinations
    () => `${randomWord()}-${randomString(6)}`,
    () => `${randomString(4)}-${randomWord()}-${randomString(4)}`,
    () => `${randomTopic}-${randomWord()}`,
    () => `${randomWord()}${randomWord()}${Math.floor(Math.random() * 100)}`
  ]

  return randomItem(formats)()
}

export const generateAvatarWithSeed = (topics: string[] = [], seedOverride?: string) => {
  const seed = seedOverride ?? generateAvatarSeed(topics)
  const avatar = new Avatar(style, { seed })

  return {
    seed,
    svg: avatar.toString(),
  }
}

export const generateAvatar = (topics: string[] = []) => generateAvatarWithSeed(topics).svg