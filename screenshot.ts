import { DELETE, SCREENSHOT } from "@selfage/puppeteer_executor_api";

export async function screenshot(imagePath: string, waitMs = 0): Promise<void> {
  let fullPath = __dirname + imagePath;

  console.log(DELETE + fullPath);
  while (true) {
    let response = await fetch(fullPath);
    if (response.status === 404) {
      break;
    }
  }

  // Hack to wait for full image rendering.
  await new Promise<void>((resolve) => setTimeout(resolve, waitMs));

  console.log(SCREENSHOT + fullPath);
  while (true) {
    let response = await fetch(fullPath);
    if (response.ok) {
      break;
    }
  }
}
