#!/usr/bin/env node

import { Command } from 'commander';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { generate } from './generate';
import { validate } from './validate';
import { validateSync } from './validate-sync';
import { validateBlocks } from './validate-blocks';
import { validateKeys } from './validate-keys';
import { loadConfig, type I18nextTypesafeConfig } from './config';

// Get __dirname in both CJS and ESM
function getDirname(): string {
  // Try ESM first
  try {
    // @ts-ignore - import.meta only exists in ESM
    if (typeof import.meta !== 'undefined' && import.meta.url) {
      const { fileURLToPath } = require('url');
      return dirname(fileURLToPath(import.meta.url));
    }
  } catch {}

  // Fall back to CJS
  return __dirname;
}

// Read version from package.json
const packageJsonPath = join(getDirname(), '../../package.json');
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));

const program = new Command();

// Helper to merge config file with CLI options (CLI takes precedence)
function mergeWithConfig(
  cliOptions: Record<string, any>,
  parentOptions: { config?: string }
): Record<string, any> {
  const config = loadConfig(parentOptions.config);

  // Default values
  const defaults = {
    input: 'src/locales/en.json',
    output: 'src/types/i18n.generated.ts',
    locales: 'src/locales',
    source: 'src',
    languages: ['en', 'he', 'fr'],
    watch: false,
  };

  // Merge: defaults < config < CLI (CLI takes highest precedence)
  const merged = { ...defaults, ...config, ...cliOptions };

  // Handle languages array properly
  if (typeof merged.languages === 'string') {
    merged.languages = merged.languages.split(',').map((l: string) => l.trim());
  }

  return merged;
}

program
  .name('i18next-typesafe')
  .description('Type-safe i18next with automatic type generation and validation')
  .version(packageJson.version)
  .option('-c, --config <path>', 'Path to config file');

// Generate command
program
  .command('generate')
  .description('Generate TypeScript types from translation JSON files')
  .option('-i, --input <path>', 'Input JSON file path')
  .option('-o, --output <path>', 'Output TypeScript file path')
  .option('-w, --watch', 'Watch mode for development')
  .action(async (options, command) => {
    const merged = mergeWithConfig(options, command.parent.opts());
    await generate(merged);
  });

// Validate command (runs all validations)
program
  .command('validate')
  .description('Run all translation validations (sync, blocks, keys)')
  .option('-l, --locales <path>', 'Locales directory path')
  .option('-s, --source <path>', 'Source code directory path')
  .option('-i, --input <path>', 'Input JSON file path')
  .option('--languages <langs>', 'Comma-separated list of language codes')
  .action(async (options, command) => {
    const merged = mergeWithConfig(options, command.parent.opts());
    await validate(merged);
  });

// Validate:sync command
program
  .command('validate:sync')
  .description('Validate translation keys are synchronized across all languages')
  .option('-l, --locales <path>', 'Locales directory path')
  .option('--languages <langs>', 'Comma-separated list of language codes')
  .action(async (options, command) => {
    const merged = mergeWithConfig(options, command.parent.opts());
    await validateSync(merged);
  });

// Validate:blocks command
program
  .command('validate:blocks')
  .description('Check for unused translation blocks/namespaces')
  .option('-l, --locales <path>', 'Locales directory path')
  .option('-s, --source <path>', 'Source code directory path')
  .option('-i, --input <path>', 'Input JSON file path')
  .action(async (options, command) => {
    const merged = mergeWithConfig(options, command.parent.opts());
    await validateBlocks(merged);
  });

// Validate:keys command
program
  .command('validate:keys')
  .description('Check for unused individual translation keys')
  .option('-l, --locales <path>', 'Locales directory path')
  .option('-s, --source <path>', 'Source code directory path')
  .option('-i, --input <path>', 'Input JSON file path')
  .action(async (options, command) => {
    const merged = mergeWithConfig(options, command.parent.opts());
    await validateKeys(merged);
  });

program.parse();
