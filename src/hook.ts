import { useTranslation } from 'react-i18next';
import type {
  TranslationKey,
  ValidKeysFor,
  EnsureTrailingDot,
  FullTranslator,
  ExpandUnion,
} from './types';

export function prefixes<const T extends readonly string[]>(...args: T): T {
  return args;
}

export function useTypedTranslation<
  TKey extends TranslationKey = TranslationKey,
  Prefixes extends readonly string[] = readonly string[]
>(
  prefixes: Prefixes
): {
  [K in keyof Prefixes]: Prefixes[K] extends ''
    ? FullTranslator
    : Prefixes[K] extends string
    ? (
        key: ExpandUnion<ValidKeysFor<TKey, EnsureTrailingDot<Prefixes[K]>>>
      ) => string
    : never;
} {
  const { t: originalT } = useTranslation();

  const normalizePrefix = (p: string): string =>
    p.endsWith('.') ? p : `${p}.`;

  return prefixes.map((prefix) => {
    if (prefix === '') {
      return (key: string): string => originalT(key);
    }

    const normalized = normalizePrefix(prefix);
    return (key: string): string => originalT(`${normalized}${key}`);
  }) as any;
}
