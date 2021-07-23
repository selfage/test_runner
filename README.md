# @selfage/test_runner

## Install
`npm install @selfage/test_runner`

## Overview

Written in TypeScript and compiled to ES6 with inline source map & source. See [@selfage/tsconfig](https://www.npmjs.com/package/@selfage/tsconfig) for full compiler options. Provides a simple test runner that makes each test file itself an exectuable file and is capable to be combined into one large test suite file.

## Test runner for Node environment

### Simple test

```TypeScript
// math.ts
export function add(a: number, b: number): number {
  return a + b;
}

// math_test.ts
import { add } from './math';
import { NODE_TEST_RUNNER, Environment } from "@selfage/test_runner";

class ComplicatedEnv implements Environment {
  public setUp(): Promise<void> {
    // ...
  }
  public tearDown(): Promise<void> {
    // ...
  }
}

NODE_TEST_RUNNER.run({
  // The name of this test set.
  name: "MathTest",
  // If you need to set up an environment for the entire test set, you can add
  // it like this.
  // environment: new ComplicatedEnv(),
  // Or define it inline.
  // environment: { setUp: () => {...}, tearDown: () => {...} },
  cases: [
    {
      // The name of each test case.
      name: "UnderTen",
      // It can also be an async function.
      execute: () => {
        // Execute
        let res = add(1, 2);

        // Verify
        if (res !== 3) {
          throw new Error('Expect to be 3.');
        }
      }
    }
  ]
});
```

After compiled with `tsc`, you can execute the test file via `node math_test.js`, which executes all test cases in this file and outputs success or failure of each case to console.

`math_test.js` is a executable file taking two command line arguments: `--set-name` or `-s`, and `--case-name` or `-c`. (`node math_test.js -h` brings up help menu.)

`node math_test.js -c UnderTen` would only execute the test case `UnderTen`.

`node math_test.js -s MathTest` would only execute the test set `MathTest` which
is helpful in a test suite.

### Test suite

Suppose we have 3 test files: `math_test.ts`, `handler_test.ts`,
`element_test.ts`. The `test_suite.ts` contains the following.

```TypeScript
import './math_test';
import './handler_test';
import './element_test';
// That's it!
```

After compiled with `tsc`, you can execute it via `node test_suite.js`, which executes all test sets in all test files and outputs success or failure of each case to console. It's helpful to include all tests in a project that needs to pass before, e.g., commiting or releasing.

`test_suite.js` is a executable file that takes `-s` and `-c`, just like `math_test.js`.

`node test_suite.js -s MathTest` makes more sense in that it only executes the test set `MathTest`.

`node test_suite.js -s MathTest -c UnderTen` would only execute the test case `UnderTen` from the test set `MathTest`.

## Test runner for Puppeteer executor environment

### Puppeteer executor environment

See [@selfage/bundler_cli#puppeteer-executor-environment](https://github.com/selfage/bundler_cli#puppeteer-executor-environment). TLDR, it's a headless Chrome environment but with some additional API provided by `@selfage/bundler_cli`.

### Add and run tests

API-wise, the only difference from above is import `PUPPETEER_TEST_RUNNER`.

```TypeScript
import { PUPPETEER_TEST_RUNNER } from "@selfage/test_runner";

PUPPETEER_TEST_RUNNER.run({
  // ...
});
```

Then run the test file with `@selfage/bundler_cli`, e.g. `$ bundage prun math_test -- -c UnderTen`. It will close the browser/page automatically, upon all tests finished. See [@selfage/bundler_cli#run-in-puppeteer](https://github.com/selfage/bundler_cli#run-in-puppeteer) for CLI explanation. And see [@selfage/puppeteer_executor_api](https://www.npmjs.com/package/@selfage/puppeteer_executor_api) for how to control browser behavior for testing purpose, such as screenshot and set viewport.

## Stack trace from TypeScript source file

Based on the amazing `source-map-support` package, stack traces from errors, especially when assertion failed, will be mapped back to TypeScript source files.
