export default (params = {}) => Object.entries(params)
  .map(([key, value]) => {
    if (typeof value === 'object') {
      return Object.entries(value)
        .map(([subKey, subValue]) => `${key}[${subKey}]=${subValue}`)
        .join('&');
    }
    return `${key}=${value}`;
  })
  .join('&');
