import { Command, ParseOptions } from "commander";
import "source-map-support/register";

export interface TestCase {
  name: string;
  execute: (environment?: Environment) => void | Promise<void>;
  setUp?: (environment?: Environment) => void | Promise<void>;
  tearDown?: (environment?: Environment) => void | Promise<void>;
}

export interface Environment {
  setUp?: () => void | Promise<void>;
  tearDown?: () => void | Promise<void>;
}

export interface TestSet {
  name: string;
  cases: Array<TestCase>;
  environment?: Environment;
}

export interface TestCaseResult {
  name: string;
  success: boolean;
}

export interface TestSetResult {
  name: string;
  cases: Array<TestCaseResult>;
}

export class TestRunner {
  private testResults = new Array<TestSetResult>();
  private prevRunPromise = Promise.resolve();

  public constructor(
    private setName: string | undefined,
    private caseName: string | undefined,
    private exitFn: () => void
  ) {}

  public static create(
    argv: Array<string>,
    parseOptions: ParseOptions,
    exitFn: () => void = () => {}
  ): TestRunner {
    let program = new Command();
    program
      .option("-s, --set-name <name>", "The name of the test set.")
      .option(
        "-c, --case-name <name>",
        "The name of the test case within a test set."
      );
    program.parse(argv, parseOptions);
    let options = program.opts();
    let runner = new TestRunner(options.setName, options.caseName, exitFn);
    // Because run() is designed to be called any number of times without a
    // clear signal of when all run() has been called, we use this hack to
    // wait for the end of the current event loop, assuming all run() calls
    // happen synchronously.
    setTimeout(() => runner.summarizeAndExit());
    return runner;
  }

  private async summarizeAndExit(): Promise<void> {
    await this.prevRunPromise;
    for (let testSetResult of this.testResults) {
      console.log(`\n\x1b[35mTest set ${testSetResult.name} result:\x1b[0m`);
      for (let testCaseResult of testSetResult.cases) {
        if (testCaseResult.success) {
          console.log(`\x1b[32m${testCaseResult.name} success!\x1b[0m`);
        } else {
          console.log(`\x1b[31m${testCaseResult.name} failed!\x1b[0m`);
        }
      }
    }
    this.exitFn();
  }

  public run(testSet: TestSet): void {
    this.prevRunPromise = TestRunner.runAfterPrevRun(
      this.prevRunPromise,
      testSet,
      this.setName,
      this.caseName,
      this.testResults
    );
  }

  private static async runAfterPrevRun(
    prevRunPromise: Promise<void>,
    testSet: TestSet,
    setName: string | undefined,
    caseName: string | undefined,
    outputTestResults: Array<TestSetResult>
  ): Promise<void> {
    await prevRunPromise;
    if (!setName || setName === testSet.name) {
      if (!caseName) {
        await TestRunner.runTestSet(testSet, outputTestResults);
      } else {
        await TestRunner.runTestCase(testSet, caseName, outputTestResults);
      }
    }
  }

  private static async runTestCase(
    testSet: TestSet,
    caseName: string,
    outputTestResults: Array<TestSetResult>
  ): Promise<void> {
    let testCase = testSet.cases.find((testCase): boolean => {
      return caseName === testCase.name;
    });
    if (!testCase) {
      throw new Error(
        `Test case ${caseName} not found in test set ${testSet.name}.`
      );
    }

    if (testSet.environment && testSet.environment.setUp) {
      await testSet.environment.setUp();
    }
    if (testCase.setUp) {
      await testCase.setUp(testSet.environment);
    }
    let success: boolean;
    try {
      await testCase.execute(testSet.environment);
      success = true;
    } catch (e) {
      console.error(e);
      success = false;
    }
    if (testCase.tearDown) {
      await testCase.tearDown(testSet.environment);
    }
    if (testSet.environment && testSet.environment.tearDown) {
      await testSet.environment.tearDown();
    }
    outputTestResults.push({
      name: testSet.name,
      cases: [{ name: caseName, success }],
    });
  }

  private static async runTestSet(
    testSet: TestSet,
    outputTestResults: Array<TestSetResult>
  ): Promise<void> {
    let testSetResult: TestSetResult = {
      name: testSet.name,
      cases: new Array<TestCaseResult>(),
    };
    console.log(`\x1b[34mTest set ${testSet.name} starts.\x1b[0m`);
    if (testSet.environment && testSet.environment.setUp) {
      await testSet.environment.setUp();
    }
    for (let testCase of testSet.cases) {
      console.log(`\x1b[33mTest case ${testCase.name} starts.\x1b[0m`);
      if (testCase.setUp) {
        await testCase.setUp(testSet.environment);
      }
      try {
        await testCase.execute(testSet.environment);
        testSetResult.cases.push({ name: testCase.name, success: true });
      } catch (e) {
        console.error(e);
        testSetResult.cases.push({ name: testCase.name, success: false });
      }
      if (testCase.tearDown) {
        await testCase.tearDown(testSet.environment);
      }
    }
    if (testSet.environment && testSet.environment.tearDown) {
      await testSet.environment.tearDown();
    }
    outputTestResults.push(testSetResult);
  }
}

export let TEST_RUNNER = TestRunner.create(process.argv, { from: "node" });
