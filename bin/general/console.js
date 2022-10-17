export function consoleWhite(message) {
  return `\x1b[37m${message}\x1b[0m`;
}

export function consoleWhiteBG(message) {
  return `\x1b[47m\x1b[30m${message}\x1b[0m`;
}

export function consoleBlack(message) {
  return `\x1b[30m${message}\x1b[0m`;
}

export function consoleBlackBG(message) {
  return `\x1b[40m\x1b[37m${message}\x1b[0m`;
}

export function consoleYellow(message) {
  return `\x1b[33m${message}\x1b[0m`;
}

export function consoleYellowBG(message) {
  return `\x1b[43m\x1b[30m${message}\x1b[0m`;
}

export function consoleRed(message) {
  return `\x1b[31m${message}\x1b[0m`;
}

export function consoleRedBG(message) {
  return `\x1b[41m\x1b[37m${message}\x1b[0m`;
}

export function consoleError(message) {
  if (global.config.log.errors)
    console.error(`${consoleRedBG(" Error ")} ${message}`);
}

export function consoleWarn(message) {
  if (global.config.log.warnings)
    console.log(`${consoleYellowBG(" Warn  ")} ${message}`);
}
