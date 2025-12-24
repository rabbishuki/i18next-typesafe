import { validateSync } from './validate-sync';
import { validateBlocks } from './validate-blocks';
import { validateKeys } from './validate-keys';

interface ValidateOptions {
  locales: string;
  source: string;
  input: string;
  languages: string[];
}

export async function validate(options: ValidateOptions): Promise<void> {
  console.log('🔍 Running all i18n validations...\n');
  console.log('━'.repeat(60));

  let hasErrors = false;

  // 1. Validate cross-language synchronization
  try {
    console.log('\n📋 Step 1/3: Cross-language synchronization');
    console.log('━'.repeat(60));
    await validateSync({
      locales: options.locales,
      languages: options.languages,
    });
  } catch (error) {
    hasErrors = true;
    console.error('\n✗ Cross-language validation failed\n');
  }

  // 2. Validate translation blocks
  try {
    console.log('\n📦 Step 2/3: Unused translation blocks');
    console.log('━'.repeat(60));
    await validateBlocks({
      locales: options.locales,
      source: options.source,
      input: options.input,
    });
  } catch (error) {
    hasErrors = true;
    console.error('\n✗ Block validation failed\n');
  }

  // 3. Validate individual keys
  try {
    console.log('\n🔑 Step 3/3: Unused translation keys');
    console.log('━'.repeat(60));
    await validateKeys({
      locales: options.locales,
      source: options.source,
      input: options.input,
    });
  } catch (error) {
    hasErrors = true;
    console.error('\n✗ Key validation failed\n');
  }

  // Summary
  console.log('\n' + '━'.repeat(60));
  if (hasErrors) {
    console.log('\n❌ Validation completed with errors');
    console.log('\nFix the issues above and run again\n');
    process.exit(1);
  } else {
    console.log('\n✅ All validations passed!');
    console.log('\nYour translations are:');
    console.log('  ✓ Synchronized across all languages');
    console.log('  ✓ All blocks are being used');
    console.log('  ✓ All keys are being used\n');
  }
}
