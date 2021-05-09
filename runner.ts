import { Command } from "commander";
import "source-map-support/register";

export interface TestCase {
  name: string;
  execute: () => void | Promise<void>;
}

export interface Environment {
  setUp: () => void | Promise<void>;
  tearDown: () => void | Promise<void>;
}

export interface TestSet {
  name: string;
  cases: TestCase[];
  environment?: Environment;
}

class TestRunner {
  private prevRunPromise = Promise.resolve();

  public constructor(
    private setName: string | undefined,
    private caseName: string | undefined
  ) {}

  public static create(): TestRunner {
    let command = new Command();
    command.option("-s, --set-name <name>", "The name of the test set.");
    command.option(
      "-c, --case-name <name>",
      "The name of the test case within a test set."
    );
    command.parse();
    return new TestRunner(command.setName, command.caseName);
  }

  public run(testSet: TestSet): void {
    this.prevRunPromise = TestRunner.runAfterPrevRun(
      this.prevRunPromise,
      testSet,
      this.setName,
      this.caseName
    );
  }

  private static async runAfterPrevRun(
    prevRunPromise: Promise<void>,
    testSet: TestSet,
    setName: string | undefined,
    caseName: string | undefined
  ): Promise<void> {
    await prevRunPromise;
    if (!setName || setName === testSet.name) {
      if (!caseName) {
        await TestRunner.runTestSet(testSet);
      } else {
        await TestRunner.runTestCase(testSet, caseName);
      }
    }
  }

  private static async runTestCase(
    testSet: TestSet,
    caseName: string
  ): Promise<void> {
    let testCase = testSet.cases.find((testCase): boolean => {
      return caseName === testCase.name;
    });
    if (testSet.environment) {
      await testSet.environment.setUp();
    }
    try {
      await testCase.execute();
    } catch (e) {
      console.log(e);
    }
    if (testSet.environment) {
      await testSet.environment.tearDown();
    }
  }

  private static async runTestSet(testSet: TestSet): Promise<void> {
    console.log("\n\x1b[35m%s test result:\x1b[0m", testSet.name);
    if (testSet.environment) {
      await testSet.environment.setUp();
    }
    for (let testCase of testSet.cases) {
      let oldLog = console.log;
      let oldInfo = console.info;
      let oldWarn = console.warn;
      let oldErr = console.error;
      console.log = () => {};
      console.info = () => {};
      console.warn = () => {};
      console.error = () => {};
      let statusMsg: string;
      try {
        await testCase.execute();
        statusMsg = `\x1b[32m${testCase.name} success!\x1b[0m`;
      } catch (e) {
        statusMsg = `\x1b[31m${testCase.name} failed!\x1b[0m`;
      }
      console.log = oldLog;
      console.info = oldInfo;
      console.warn = oldWarn;
      console.error = oldErr;
      console.log(statusMsg);
    }
    if (testSet.environment) {
      await testSet.environment.tearDown();
    }
  }
}

export let TEST_RUNNER = TestRunner.create();
