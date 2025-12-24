import { useTranslation } from 'react-i18next';

export function prefixes<const T extends readonly string[]>(...args: T): T {
  return args;
}

type KeysStartingWith<TKey extends string, Prefix extends string> = Extract<
  TKey,
  `${Prefix}${string}`
>;

type RemovePrefix<Prefix extends string, Key extends string> =
  Key extends `${Prefix}${infer Suffix}` ? Suffix : never;

type ValidKeysFor<TKey extends string, Prefix extends string> = RemovePrefix<
  Prefix,
  KeysStartingWith<TKey, Prefix>
>;

type EnsureTrailingDot<T extends string> = T extends `${infer _}.` ? T : `${T}.`;

type FullTranslator = (key: string, params?: Record<string, any>) => string;

type ExpandUnion<T> = T extends any ? T : never;

export function useTypedTranslation<
  TKey extends string = string,
  Prefixes extends readonly string[] = readonly string[]
>(
  prefixes: Prefixes
): {
  [K in keyof Prefixes]: Prefixes[K] extends ''
    ? FullTranslator
    : Prefixes[K] extends string
    ? (
        key: ExpandUnion<ValidKeysFor<TKey, EnsureTrailingDot<Prefixes[K]>>>,
        params?: Record<string, any>
      ) => string
    : never;
} {
  const { t: originalT } = useTranslation();

  const normalizePrefix = (p: string): string =>
    p.endsWith('.') ? p : `${p}.`;

  return prefixes.map((prefix) => {
    if (prefix === '') {
      return (key: string, params?: Record<string, any>): string =>
        originalT(key, params);
    }

    const normalized = normalizePrefix(prefix);
    return (key: string, params?: Record<string, any>): string =>
      originalT(`${normalized}${key}`, params);
  }) as any;
}
