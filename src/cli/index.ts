#!/usr/bin/env node

import { Command } from 'commander';
import { generate } from './generate';

const program = new Command();

program
  .name('i18next-typesafe')
  .description('Type-safe i18next with automatic type generation')
  .version('0.1.0');

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

program.parse();
