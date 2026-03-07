export function parseId(value: string | undefined): number | null {
  const idString = Array.isArray(value) ? value[0] : value

  if (!idString || idString.trim() === '' || idString.includes('.') || idString.startsWith('-')) {
    return null
  }

  if (!/^\d+$/.test(idString.trim())) {
    return null
  }

  const id = parseInt(idString, 10)
  if (isNaN(id) || id <= 0 || id > 2147483647) {
    return null
  }
  return id
}
