import { useMemo } from "react"

type EnumMapping<T extends string | number, R> = {
  [K in T]?: R
} & {
  default: R
}

export const useEnumMapping = <T extends string | number, R>(value: T, mapping: EnumMapping<T, R>): R => {
  return useMemo(() => {
    return mapping[value] ?? mapping.default
  }, [value, mapping])
}
