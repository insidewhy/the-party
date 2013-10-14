module dep3 from './dep3'
export function second() { return 2 + dep3.third() }
