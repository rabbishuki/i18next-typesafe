export type TranslationKey = string;

export type KeysStartingWith<
  TKey extends string,
  Prefix extends string
> = Extract<TKey, `${Prefix}${string}`>;

export type RemovePrefix<
  Prefix extends string,
  Key extends string
> = Key extends `${Prefix}${infer Suffix}` ? Suffix : never;

export type ValidKeysFor<
  TKey extends string,
  Prefix extends string
> = RemovePrefix<Prefix, KeysStartingWith<TKey, Prefix>>;

export type EnsureTrailingDot<T extends string> = T extends `${infer _}.`
  ? T
  : `${T}.`;

export type FullTranslator = (key: string) => string;

export type ExpandUnion<T> = T extends any ? T : never;
