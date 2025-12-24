import * as fs from 'fs';
import * as path from 'path';

interface ValidateSyncOptions {
  locales: string;
  languages: string[];
}

function flattenKeys(obj: Record<string, any>, prefix = ''): Set<string> {
  const keys = new Set<string>();

  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;

    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      for (const nestedKey of flattenKeys(value, fullKey)) {
        keys.add(nestedKey);
      }
    } else {
      keys.add(fullKey);
    }
  }

  return keys;
}

function loadTranslationFile(localesPath: string, lang: string): Set<string> | null {
  const filePath = path.join(localesPath, `${lang}.json`);

  if (!fs.existsSync(filePath)) {
    console.warn(`⚠ Warning: Translation file not found: ${filePath}`);
    return null;
  }

  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const translations = JSON.parse(content);
    return flattenKeys(translations);
  } catch (error) {
    console.error(`✗ Error reading ${filePath}:`, error);
    return null;
  }
}

export async function validateSync(options: ValidateSyncOptions): Promise<void> {
  const { locales, languages } = options;

  console.log('🔍 Validating translation key synchronization...\n');

  // Load all translation files
  const translationSets = new Map<string, Set<string>>();
  for (const lang of languages) {
    const keys = loadTranslationFile(locales, lang);
    if (keys) {
      translationSets.set(lang, keys);
    }
  }

  if (translationSets.size < 2) {
    console.error('✗ Need at least 2 translation files to compare');
    process.exit(1);
  }

  // Compare all language pairs
  const languageList = Array.from(translationSets.keys());
  let hasErrors = false;

  for (let i = 0; i < languageList.length; i++) {
    for (let j = i + 1; j < languageList.length; j++) {
      const lang1 = languageList[i];
      const lang2 = languageList[j];
      const keys1 = translationSets.get(lang1)!;
      const keys2 = translationSets.get(lang2)!;

      // Find keys only in lang1
      const onlyInLang1 = Array.from(keys1).filter(key => !keys2.has(key));

      // Find keys only in lang2
      const onlyInLang2 = Array.from(keys2).filter(key => !keys1.has(key));

      if (onlyInLang1.length > 0 || onlyInLang2.length > 0) {
        hasErrors = true;
        console.log(`\n❌ Mismatch between ${lang1} and ${lang2}:`);

        if (onlyInLang1.length > 0) {
          console.log(`\n  Keys only in ${lang1}.json (${onlyInLang1.length}):`);
          onlyInLang1.slice(0, 10).forEach(key => console.log(`    - ${key}`));
          if (onlyInLang1.length > 10) {
            console.log(`    ... and ${onlyInLang1.length - 10} more`);
          }
        }

        if (onlyInLang2.length > 0) {
          console.log(`\n  Keys only in ${lang2}.json (${onlyInLang2.length}):`);
          onlyInLang2.slice(0, 10).forEach(key => console.log(`    - ${key}`));
          if (onlyInLang2.length > 10) {
            console.log(`    ... and ${onlyInLang2.length - 10} more`);
          }
        }
      }
    }
  }

  if (!hasErrors) {
    console.log('✓ All translation files are synchronized!');
    console.log(`\n  Languages checked: ${languageList.join(', ')}`);
    console.log(`  Total keys: ${translationSets.get(languageList[0])!.size}`);
  } else {
    console.log('\n❌ Translation files are out of sync');
    process.exit(1);
  }
}
