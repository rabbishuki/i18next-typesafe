#!/usr/bin/env node

import { Command } from 'commander';
import { generate } from './generate';
import { validate } from './validate';
import { validateSync } from './validate-sync';
import { validateBlocks } from './validate-blocks';
import { validateKeys } from './validate-keys';

const program = new Command();

program
  .name('i18next-typesafe')
  .description('Type-safe i18next with automatic type generation and validation')
  .version('0.1.0');

// Generate command
program
  .command('generate')
  .description('Generate TypeScript types from translation JSON files')
  .option('-i, --input <path>', 'Input JSON file path', 'src/locales/en.json')
  .option(
    '-o, --output <path>',
    'Output TypeScript file path',
    'src/types/i18n.generated.ts'
  )
  .option('-w, --watch', 'Watch mode for development', false)
  .action(async (options) => {
    await generate(options);
  });

// Validate command (runs all validations)
program
  .command('validate')
  .description('Run all translation validations (sync, blocks, keys)')
  .option('-l, --locales <path>', 'Locales directory path', 'src/locales')
  .option('-s, --source <path>', 'Source code directory path', 'src')
  .option('-i, --input <path>', 'Input JSON file path', 'src/locales/en.json')
  .option(
    '--languages <langs>',
    'Comma-separated list of language codes',
    'en,he,fr'
  )
  .action(async (options) => {
    await validate({
      ...options,
      languages: options.languages.split(',').map((l: string) => l.trim()),
    });
  });

// Validate:sync command
program
  .command('validate:sync')
  .description('Validate translation keys are synchronized across all languages')
  .option('-l, --locales <path>', 'Locales directory path', 'src/locales')
  .option(
    '--languages <langs>',
    'Comma-separated list of language codes',
    'en,he,fr'
  )
  .action(async (options) => {
    await validateSync({
      ...options,
      languages: options.languages.split(',').map((l: string) => l.trim()),
    });
  });

// Validate:blocks command
program
  .command('validate:blocks')
  .description('Check for unused translation blocks/namespaces')
  .option('-l, --locales <path>', 'Locales directory path', 'src/locales')
  .option('-s, --source <path>', 'Source code directory path', 'src')
  .option('-i, --input <path>', 'Input JSON file path', 'src/locales/en.json')
  .action(async (options) => {
    await validateBlocks(options);
  });

// Validate:keys command
program
  .command('validate:keys')
  .description('Check for unused individual translation keys')
  .option('-l, --locales <path>', 'Locales directory path', 'src/locales')
  .option('-s, --source <path>', 'Source code directory path', 'src')
  .option('-i, --input <path>', 'Input JSON file path', 'src/locales/en.json')
  .action(async (options) => {
    await validateKeys(options);
  });

program.parse();
