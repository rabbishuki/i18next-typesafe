import * as fs from 'fs';
import * as path from 'path';
import { matchesPattern, type I18nextTypesafeConfig } from './config';

interface ValidateKeysOptions {
  locales: string;
  source: string;
  input: string;
  validation?: I18nextTypesafeConfig['validation'];
}

function flattenKeys(obj: Record<string, any>, prefix = ''): string[] {
  const keys: string[] = [];

  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;

    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      keys.push(...flattenKeys(value, fullKey));
    } else {
      keys.push(fullKey);
    }
  }

  return keys;
}

function searchSourceForKeys(sourceDir: string): Set<string> {
  const extensions = ['.ts', '.tsx', '.js', '.jsx'];
  const foundKeys = new Set<string>();

  // Regex to match translation function calls: t('key') or tPricing('key')
  const translationPattern = /\b(?:t|t[A-Z]\w*)\(\s*['"`]([^'"`]+)['"`]/g;

  function searchDirectory(dir: string): void {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          if (['node_modules', 'dist', 'build', '.git'].includes(entry.name)) {
            continue;
          }
          searchDirectory(fullPath);
        } else if (entry.isFile() && extensions.some(ext => entry.name.endsWith(ext))) {
          const content = fs.readFileSync(fullPath, 'utf-8');

          let match;
          while ((match = translationPattern.exec(content)) !== null) {
            foundKeys.add(match[1]);
          }
        }
      }
    } catch (error) {
      // Silently skip directories we can't read
    }
  }

  searchDirectory(sourceDir);
  return foundKeys;
}

function getBlockPrefixes(obj: Record<string, any>, prefix = ''): Set<string> {
  const prefixes = new Set<string>();

  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;

    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      prefixes.add(fullKey);
      for (const nestedPrefix of getBlockPrefixes(value, fullKey)) {
        prefixes.add(nestedPrefix);
      }
    }
  }

  return prefixes;
}

export async function validateKeys(options: ValidateKeysOptions): Promise<void> {
  const { locales, source, input } = options;

  console.log('🔍 Checking for unused translation keys...\n');

  // Load translation file
  const translationPath = path.join(locales, path.basename(input));
  if (!fs.existsSync(translationPath)) {
    console.error(`✗ Translation file not found: ${translationPath}`);
    process.exit(1);
  }

  const fileContent = fs.readFileSync(translationPath, 'utf-8');
  const translations = JSON.parse(fileContent);

  // Get all translation keys and prefixes
  const allKeys = new Set(flattenKeys(translations));
  const blockPrefixes = getBlockPrefixes(translations);
  console.log(`Total translation keys: ${allKeys.size}`);

  // Search source code for used keys
  console.log('Scanning source code...');
  const usedKeys = searchSourceForKeys(source);
  console.log(`Found ${usedKeys.size} translation calls in code\n`);

  // Get ignore patterns from config
  const ignorePatterns = options.validation?.ignoreKeys || [];

  // Find unused keys (excluding block prefixes and ignored patterns)
  const unusedKeys = Array.from(allKeys).filter(
    key =>
      !usedKeys.has(key) &&
      !blockPrefixes.has(key) &&
      !matchesPattern(key, ignorePatterns)
  );

  // Count ignored keys for reporting
  const ignoredKeys = Array.from(allKeys).filter(key =>
    matchesPattern(key, ignorePatterns)
  );

  // Group unused keys by block for better reporting
  const unusedByBlock = new Map<string, string[]>();
  for (const key of unusedKeys) {
    const parts = key.split('.');
    const blockPrefix = parts.slice(0, -1).join('.');

    if (!unusedByBlock.has(blockPrefix)) {
      unusedByBlock.set(blockPrefix, []);
    }
    unusedByBlock.get(blockPrefix)!.push(key);
  }

  // Report ignored keys if any
  if (ignoredKeys.length > 0) {
    console.log(`ℹ Ignoring ${ignoredKeys.length} keys (from config patterns)\n`);
  }

  // Report results
  if (unusedKeys.length > 0) {
    console.log(`⚠ Found ${unusedKeys.length} unused translation keys:\n`);

    // Show grouped by block
    for (const [block, keys] of unusedByBlock.entries()) {
      console.log(`  Block: ${block || '(root)'}`);
      keys.slice(0, 5).forEach(key => {
        const shortKey = key.split('.').pop();
        console.log(`    - ${shortKey}`);
      });
      if (keys.length > 5) {
        console.log(`    ... and ${keys.length - 5} more`);
      }
      console.log();
    }

    console.log(`💡 These keys exist in translations but aren't used in code`);
    console.log(`   Consider removing them or verify they're needed\n`);

    // Exit with error if there are many unused keys
    if (unusedKeys.length > 10) {
      process.exit(1);
    }
  } else {
    console.log('✓ All translation keys are being used!');
    console.log(`\n  Keys checked: ${allKeys.size}`);
    if (ignoredKeys.length > 0) {
      console.log(`  Ignored keys: ${ignoredKeys.length}`);
    }
    console.log(`  All keys found in source code`);
  }
}
