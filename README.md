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
import { TEST_RUNNER } from "@selfage/test_runner";

TEST_RUNNER.run({
  // The name of this test set.
  name: "MathTest",
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

### Advanced test

```TypeScript
// flush.ts
export async function flush(databaseConnection: any): Promise<void> {
  await databaseConnection.write({});
}

// flush_test.ts
import { flush } from './flush';
import { TEST_RUNNER, Environment } from "@selfage/test_runner";

TEST_RUNNER.run({
  name: "FlushTest",
  environment: new class implements Environment {
    public databaseConnection: any;
    public async setUp(): Promise<void> {
      databaseConnection = await DatabaseConnection.establish();
    }
    public async tearDown(): Promise<void> {
      await databaseConnection.dispose();
    }
  },
  cases: [{
    name: "Success",
    setUp: async (environment) => {
      // More setup with environment.databaseConnection.
    },
    execute: async (environment) => {
      await flush(environment.databaseConnection);
    },
    tearDown: async (environment) => {
      // Cleanup data especially when test failed.
    }
  }]
});
```

For advanced usage, you can supply an implementation of `Environment` as well as `setUp()` and `tearDown()` for each test case.

Note that all functions include `execute()` can return a `Promise` for async operators.

## Test runner for Puppeteer test executor environment

### Puppeteer test executor environment

The test file can only work properly if it's executed by [@selfage/puppeteer_test_executor](https://www.npmjs.com/package/@selfage/puppeteer_test_executor) or [@selfage/bundler_cli](https://www.npmjs.com/package/@selfage/bundler_cli). TLDR, they provide a browser context/environment with more powerful global functions, among which `puppeteerExit()` is used by the test runner to close the page after all tests are finished, otherwise a page can hang on, waiting for user interactions forever.

### Add and run tests

API-wise, there is literally no difference. The lib will check to create the appropriate test runner. Browser-specific functions can now be used in test bodies.

```TypeScript
import { TEST_RUNNER } from "@selfage/test_runner";

TEST_RUNNER.run({
  // ...
  // Note this file is run in browser context with an empty HTML page.
  // So you have to make sure that partially created DOM trees are appended to
  // HTML body and also will be cleaned up between test cases.
});
```

Then run the test file with `@selfage/puppeteer_test_executor`, e.g. `$ pexe math_test -- -c UnderTen`. See [@selfage/puppeteer_test_executor_api](https://www.npmjs.com/package/@selfage/puppeteer_test_executor_api) for more APIs to interact with file systems or control browser behaviors that can be used by each test case.

## Stack trace from TypeScript source file

Based on the amazing `source-map-support` package, stack traces from errors, especially when assertion failed, will be mapped back to TypeScript source files.
