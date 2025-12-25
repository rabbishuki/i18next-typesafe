import * as fs from 'fs';
import * as path from 'path';
import { matchesPattern, type I18nextTypesafeConfig } from './config';

interface ValidateBlocksOptions {
  locales: string;
  source: string;
  input: string;
  validation?: I18nextTypesafeConfig['validation'];
}

interface Block {
  prefix: string;
  keyCount: number;
}

function getTranslationBlocks(obj: Record<string, any>, prefix = ''): Block[] {
  const blocks: Block[] = [];

  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;

    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      // Check if this is a leaf block (contains only string values)
      const entries = Object.entries(value);
      const hasOnlyStrings = entries.every(
        ([, v]) => typeof v === 'string' || v === null
      );

      if (hasOnlyStrings && entries.length > 0) {
        // This is a leaf block
        blocks.push({
          prefix: fullKey,
          keyCount: entries.length,
        });
      }

      // Recursively check nested objects
      blocks.push(...getTranslationBlocks(value, fullKey));
    }
  }

  return blocks;
}

function searchSourceForPrefix(sourceDir: string, prefix: string): boolean {
  const extensions = ['.ts', '.tsx', '.js', '.jsx'];

  function searchDirectory(dir: string): boolean {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        // Skip node_modules and common build directories
        if (entry.isDirectory()) {
          if (['node_modules', 'dist', 'build', '.git'].includes(entry.name)) {
            continue;
          }
          if (searchDirectory(fullPath)) {
            return true;
          }
        } else if (entry.isFile() && extensions.some(ext => entry.name.endsWith(ext))) {
          const content = fs.readFileSync(fullPath, 'utf-8');

          // Look for useTypedTranslation with this prefix
          // Matches: prefixes('prefix', ...) or prefixes("prefix", ...)
          const patterns = [
            new RegExp(`prefixes\\([^)]*['"\`]${escapeRegex(prefix)}['"\`][^)]*\\)`, 'g'),
            // Also check for old-style usage with just the prefix string
            new RegExp(`['"\`]${escapeRegex(prefix)}['"\`]`, 'g'),
          ];

          for (const pattern of patterns) {
            if (pattern.test(content)) {
              return true;
            }
          }
        }
      }
    } catch (error) {
      // Silently skip directories we can't read
    }

    return false;
  }

  return searchDirectory(sourceDir);
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function validateBlocks(options: ValidateBlocksOptions): Promise<void> {
  const { locales, source, input } = options;

  console.log('🔍 Checking for unused translation blocks...\n');

  // Load translation file
  const translationPath = path.join(locales, path.basename(input));
  if (!fs.existsSync(translationPath)) {
    console.error(`✗ Translation file not found: ${translationPath}`);
    process.exit(1);
  }

  const fileContent = fs.readFileSync(translationPath, 'utf-8');
  const translations = JSON.parse(fileContent);

  // Get all translation blocks
  const blocks = getTranslationBlocks(translations);
  console.log(`Found ${blocks.length} translation blocks\n`);

  // Get ignore patterns from config
  const ignorePatterns = options.validation?.ignoreBlocks || [];

  // Check each block for usage
  const unusedBlocks: Block[] = [];
  const usedBlocks: Block[] = [];
  const ignoredBlocks: Block[] = [];

  for (const block of blocks) {
    // Check if block should be ignored
    if (matchesPattern(block.prefix, ignorePatterns)) {
      ignoredBlocks.push(block);
      continue;
    }

    const isUsed = searchSourceForPrefix(source, block.prefix);
    if (isUsed) {
      usedBlocks.push(block);
    } else {
      unusedBlocks.push(block);
    }
  }

  // Report ignored blocks if any
  if (ignoredBlocks.length > 0) {
    console.log(`ℹ Ignoring ${ignoredBlocks.length} blocks (from config patterns)\n`);
  }

  // Report results
  if (unusedBlocks.length > 0) {
    console.log(`❌ Found ${unusedBlocks.length} unused translation blocks:\n`);

    unusedBlocks.forEach(block => {
      console.log(`  ✗ ${block.prefix} (${block.keyCount} keys)`);
    });

    console.log(`\n  Total unused keys: ${unusedBlocks.reduce((sum, b) => sum + b.keyCount, 0)}`);
    console.log(`\n💡 Tip: Add useTypedTranslation(prefixes('${unusedBlocks[0].prefix}')) to use this block\n`);

    process.exit(1);
  } else {
    console.log('✓ All translation blocks are being used!');
    console.log(`\n  Blocks checked: ${blocks.length}`);
    if (ignoredBlocks.length > 0) {
      console.log(`  Ignored blocks: ${ignoredBlocks.length}`);
    }
    console.log(`  All blocks found in source code`);
  }
}
