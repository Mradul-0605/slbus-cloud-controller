export const formatBrightness = (value) => {
  return Math.round((value / 254) * 100) + '%'
}

export const formatTemperature = (kelvin) => {
  return kelvin + 'K'
}

export const getDeviceType = (type) => {
  const types = {
    'led': '💡',
    'dimmer': '💡', 
    'switch': '🔌',
    'fan': '🌀',
    'ac': '❄️',
    'curtain': '🪟',
    'plug': '🔌',
    'rgb': '🌈',
    'white_tunable': '💡'
  }
  return types[type] || '📱'
}

export const getStatusColor = (status) => {
  return status ? 'text-green-400' : 'text-gray-400'
}

export const getStatusBadge = (status) => {
  return status ? '🟢 ON' : '⚪ OFF'
}

export const debounce = (func, wait) => {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

export const capitalize = (str) => {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export const groupBy = (array, key) => {
  return array.reduce((result, item) => {
    const groupKey = item[key]
    if (!result[groupKey]) {
      result[groupKey] = []
    }
    result[groupKey].push(item)
    return result
  }, {})
}