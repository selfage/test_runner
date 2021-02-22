# @selfage/test_runner

## Install
`npm install @selfage/test_runner`

## Overview
Written in TypeScript and compiled to ES6 with inline source map & source. See [@selfage/tsconfig](https://www.npmjs.com/package/@selfage/tsconfig) for full compiler options. Provides a minimalist test runner, which runs one or more test sets containing one more test cases.

## Simple test

```TypeScript
// math.ts
export function add(a: number, b: number): number {
  return a + b;
}

// math_test.ts
import { add } from './math';
import { TEST_RUNNER, Environment } from "@selfage/test_runner";

class ComplicatedEnv implements Environment {
  public setUp(): Promise<void> {
    // ...
  }
  public tearDown(): Promise<void> {
    // ...
  }
}

TEST_RUNNER.run({
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

After compiled with `tsc`, you can execute the test file via
`node math_test.js`, which executes all test cases in this file and outputs
success or failure of each case to console. Note that logs to console in each
test case is ignored.

`math_test.js` is a runnable file taking two command line arguments:
`--set-name` or `-s`, and `--case-name` or `-c`. (`node math_test.js -h` brings
up help menu.)

`node math_test.js -c UnderTen` would only execute the test case `UnderTen` and
all logs to console are output as usual to help debug.

`node math_test.js -s MathTest` would only execute the test set `MathTest` which
is helpful in a test suite.

## Test suite

Suppose we have 3 test files: `math_test.ts`, `handler_test.ts`,
`element_test.ts`. The `test_suite.ts` contains the following.

```TypeScript
import './math_test';
import './handler_test';
import './element_test';
// That's it!
```

After compiled with `tsc`, you can execute it via `node test_suite.js`, which
executes the test set in each test file and outputs success or failure of each
case to console. It's helpful to include all tests in a project that needs to
pass before, e.g., commiting or releasing. Also logs to console in each test
case is ignored.

`test_suite.js` is a runnable file that takes `-s` and `-c`, just like
`math_test.js`.

`node test_suite.js -s MathTest` makes more sense in that it only executes the
test set `MathTest`.

`node test_suite.js -s MathTest -c UnderTen` would only execute the test case
`UnderTen` from the test set `MathTest`.

## Stack trace from TypeScript source file

Based on the amazing `source-map-support` package, stack traces from errors, especially when assertion failed, will be mapped back to TypeScript source files.