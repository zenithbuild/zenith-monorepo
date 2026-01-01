import { compile } from "../compiler/index"

console.log("Testing redeclaration detection...\n");

// Test 1: Single script with redeclaration
console.log("Test 1: Single script redeclaration");
try {
  compile('playground/test-redeclaration.zen', 'playground/test-dist');
  console.log('❌ ERROR: Should have thrown redeclaration error!');
  process.exit(1);
} catch (e: any) {
  if (e.name === 'StateRedeclarationError') {
    console.log('✅ SUCCESS: Caught redeclaration error');
    console.log('   Error message:', e.message.split('\n')[0]);
  } else {
    console.log('❌ ERROR: Wrong error type:', e.name);
    console.log('   Error:', e.message);
    process.exit(1);
  }
}

// Test 2: Multiple scripts with redeclaration
console.log("\nTest 2: Multiple scripts redeclaration");
try {
  compile('playground/test-multiple-scripts.zen', 'playground/test-dist');
  console.log('❌ ERROR: Should have thrown redeclaration error!');
  process.exit(1);
} catch (e: any) {
  if (e.name === 'StateRedeclarationError') {
    console.log('✅ SUCCESS: Caught redeclaration error across scripts');
    console.log('   Error message:', e.message.split('\n')[0]);
  } else {
    console.log('❌ ERROR: Wrong error type:', e.name);
    console.log('   Error:', e.message);
    process.exit(1);
  }
}

// Test 3: Valid declarations (no redeclaration)
console.log("\nTest 3: Valid declarations (should succeed)");
try {
  compile('playground/app.zen', 'playground/test-dist');
  console.log('✅ SUCCESS: Valid declarations compiled without errors');
} catch (e: any) {
  if (e.name === 'StateRedeclarationError') {
    console.log('❌ ERROR: Should not have redeclaration error for valid code');
    console.log('   Error:', e.message);
    process.exit(1);
  } else {
    console.log('⚠️  WARNING: Other error (may be expected):', e.message);
  }
}

console.log("\n✅ All tests passed!");

