/* DATES */
export const getFormattedDateTime = () => {
  const now = new Date()

  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  const seconds = String(now.getSeconds()).padStart(2, '0')

  return `${year}${month}${day}${hours}${minutes}${seconds}`
}

/* SVG */
export const svgToDataUri = (svg: string) => {
  const encoded = encodeURIComponent(svg)
  return `data:image/svg+xml;charset=utf-8,${encoded}`
}

export const dataUriToSvg = (value: string) => {
  if (!value.startsWith('data:image/svg+xml')) return value

  try {
    const encoded = value.replace(/^data:image\/svg\+xml(;charset=utf-8)?;base64,/, '')
    if (encoded === value) {
      return decodeURIComponent(value.replace(/^data:image\/svg\+xml;charset=utf-8,/, ''))
    }

    return atob(encoded)
  } catch {
    return value
  }
}

/* Key Generation */
export const generateRandomString = (length: number): string => {
  const charset =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_-+={}[]|'
  let result = ''

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length)
    result += charset.charAt(randomIndex)
  }

  return result
}

export const getInitials = (fullName: string): string => {
  if (fullName.includes(' ')) {
    const firstName = fullName.split(' ')[0].toLowerCase()
    const lastName = fullName.split(' ')[1].toLowerCase()
    return firstName[0] + lastName[0]
  }
}

/* AVATARS */
export const normalizeAvatarSource = (value?: string | null) => {
  if (!value) return ''

  const trimmed = value.trim()
  if (!trimmed) return ''
  if (trimmed.startsWith('<svg')) {
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(trimmed)}`
  }

  return trimmed
}