# i18next-typesafe

Type-safe i18next wrapper for React with automatic TypeScript type generation.

## Features

- **Full type safety** - Autocomplete and type checking for translation keys
- **Scoped translators** - Create multiple translators scoped to specific prefixes
- **Zero runtime overhead** - Types are compile-time only
- **Simple API** - Uses familiar `react-i18next` under the hood
- **CLI for type generation** - Automatically generate types from JSON files
- **Built-in validation** - Find missing keys, unused translations, and cross-language mismatches

## Installation

```bash
npm install i18next-typesafe
# or
yarn add i18next-typesafe
# or
pnpm add i18next-typesafe
```

**Peer dependencies** (you probably already have these):
```bash
npm install react react-i18next i18next
```

## Quick Start

### 1. Generate Types

First, generate TypeScript types from your translation JSON files:

```bash
npx i18next-typesafe generate -i src/locales/en.json -o src/types/i18n.generated.ts
```

This creates a `TranslationKey` type from your translations:

```typescript
// src/types/i18n.generated.ts (auto-generated)
export type TranslationKey =
  | 'navigation.home'
  | 'navigation.dashboard'
  | 'form.newItem.pricing.title'
  | 'form.newItem.pricing.startingPrice'
  | 'general.save'
  | 'general.cancel'
  // ... all your keys
  ;
```

### 2. Use in Your Components

```typescript
import { useTypedTranslation, prefixes } from 'i18next-typesafe';

function MyComponent() {
  // Create scoped translators
  const [tPricing, tGeneral] = useTypedTranslation(
    prefixes('form.newItem.pricing', 'general')
  );

  return (
    <div>
      <h2>{tPricing('title')}</h2>           {/* ✅ Type-safe */}
      <p>{tPricing('startingPrice')}</p>     {/* ✅ Autocomplete */}
      <button>{tGeneral('save')}</button>    {/* ✅ Type checked */}

      {/* ❌ TypeScript errors: */}
      {/* tPricing('save') - 'save' is not in pricing */}
      {/* tGeneral('title') - 'title' is not in general */}
    </div>
  );
}
```

## Usage Patterns

### Pattern 1: Scoped Translators (Recommended)

Most components only need translations from specific sections:

```typescript
const [tPricing, tProduct, tGeneral] = useTypedTranslation(
  prefixes('form.newItem.pricing', 'form.newItem.product', 'general')
);

return (
  <>
    <h2>{tPricing('title')}</h2>
    <p>{tProduct('name')}</p>
    <button>{tGeneral('save')}</button>
  </>
);
```

### Pattern 2: With Parameters

i18next supports interpolation - pass parameters as the second argument:

```typescript
const [tForm] = useTypedTranslation(prefixes('form.newItem'));

// Translation: "Item will be moved from catalog {{from}} to catalog {{to}}"
return <p>{tForm('catalogChanged', { from: 'A', to: 'B' })}</p>;
```

### Pattern 3: Full + Scoped (For Dynamic Keys)

When you need both static type-safe keys and dynamic runtime keys:

```typescript
const TRANSLATE_BASE = 'form.newItem.pricing.';

const [t, tPricing] = useTypedTranslation(
  prefixes('', 'form.newItem.pricing')
);

return (
  <>
    {/* Dynamic keys with full translator */}
    <h2>{t(TRANSLATE_BASE + 'title')}</h2>

    {/* Type-safe keys with scoped translator */}
    <p>{tPricing('startingPrice')}</p>
  </>
);
```

### Pattern 4: Full Translator Only (Backward Compatible)

For maximum flexibility, use the full translator:

```typescript
const [t] = useTypedTranslation(prefixes(''));

return <h2>{t('any.translation.key')}</h2>;
```

## CLI Commands

### Generate Types

```bash
npx i18next-typesafe generate [options]
```

**Options:**
- `-i, --input <path>` - Input JSON file (default: `src/locales/en.json`)
- `-o, --output <path>` - Output TypeScript file (default: `src/types/i18n.generated.ts`)
- `-w, --watch` - Watch mode for development

**Examples:**

```bash
# Basic usage
npx i18next-typesafe generate

# Custom paths
npx i18next-typesafe generate -i locales/en.json -o types/translations.ts

# Watch mode for development
npx i18next-typesafe generate --watch
```

### Validate Translations

#### Run All Validations

```bash
npx i18next-typesafe validate [options]
```

Runs all validation checks: cross-language sync, unused blocks, and unused keys.

**Options:**
- `-l, --locales <path>` - Locales directory (default: `src/locales`)
- `-s, --source <path>` - Source code directory (default: `src`)
- `-i, --input <path>` - Input JSON file (default: `src/locales/en.json`)
- `--languages <langs>` - Comma-separated language codes (default: `en,he,fr`)

#### Individual Validation Commands

**Check cross-language synchronization:**
```bash
npx i18next-typesafe validate:sync --languages en,he,fr
```

Finds keys that exist in one language but not in others.

**Check for unused translation blocks:**
```bash
npx i18next-typesafe validate:blocks
```

Finds translation blocks/namespaces that aren't referenced in code via `useTypedTranslation(prefixes('block.name'))`.

**Check for unused individual keys:**
```bash
npx i18next-typesafe validate:keys
```

Finds individual translation keys that aren't used anywhere in the code.

### Add to package.json

```json
{
  "scripts": {
    "i18n:generate": "i18next-typesafe generate",
    "i18n:watch": "i18next-typesafe generate --watch",
    "i18n:validate": "i18next-typesafe validate",
    "i18n:validate:sync": "i18next-typesafe validate:sync",
    "i18n:validate:blocks": "i18next-typesafe validate:blocks",
    "i18n:validate:keys": "i18next-typesafe validate:keys"
  }
}
```

## Naming Convention

For validation commands to work correctly, follow this naming convention:

- ✅ `t` - full translator (detected by validation)
- ✅ `tPricing`, `tGeneral`, `tProduct` - scoped translators (detected)
- ❌ `pricing`, `general` - won't be detected

```typescript
// ✅ GOOD - Will be detected by validate:keys
const [t] = useTypedTranslation(prefixes(''));
const [tPricing, tGeneral] = useTypedTranslation(prefixes('form.pricing', 'general'));

// ❌ BAD - Won't be detected
const [pricing, general] = useTypedTranslation(prefixes('form.pricing', 'general'));
```

## TypeScript Configuration

Make sure your `tsconfig.json` includes the generated types:

```json
{
  "compilerOptions": {
    "strict": true
  },
  "include": [
    "src/**/*",
    "src/types/i18n.generated.ts"
  ]
}
```

## How It Works

1. **Type Generation**: The CLI reads your translation JSON, flattens nested keys to dot notation, and generates a TypeScript union type
2. **Type Utilities**: Generic TypeScript types extract valid keys for each prefix
3. **Runtime Hook**: Wraps `react-i18next`'s `useTranslation` with type-safe scoped translators
4. **Zero Overhead**: All type checking happens at compile-time - no runtime cost

## API Reference

### `useTypedTranslation(prefixes)`

Creates type-safe translators scoped to specific prefixes.

**Parameters:**
- `prefixes` - Array of prefix strings (use the `prefixes()` helper)
  - Empty string `''` creates a full translator (any key)
  - Non-empty string creates a scoped translator (only keys under that prefix)

**Returns:** Array of translator functions matching the input prefixes

### `prefixes(...args)`

Helper function to create the prefixes array with proper TypeScript inference.

**Parameters:**
- `...args` - Prefix strings

**Returns:** Readonly array of prefix strings with literal types preserved

## License

MIT

## Contributing

Contributions welcome! Please open an issue or PR on [GitHub](https://github.com/rabbishuki/i18next-typesafe).
