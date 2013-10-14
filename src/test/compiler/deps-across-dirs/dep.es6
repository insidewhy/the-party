module dep2 from './lib/dep2'
export function first() { return 1 + dep2.second() }
