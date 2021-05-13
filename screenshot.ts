import { DELETE, SCREENSHOT } from "@selfage/puppeteer_executor_api/cmds";

export async function screenshot(imagePath: string, waitMs = 0): Promise<void> {
  console.log(DELETE + imagePath);
  while (true) {
    let response = await fetch(imagePath);
    if (response.status === 404) {
      break;
    }
  }

  // Hack to wait for full image rendering.
  await new Promise<void>((resolve) => setTimeout(resolve, waitMs));

  console.log(SCREENSHOT + imagePath);
  while (true) {
    let response = await fetch(imagePath);
    if (response.ok) {
      break;
    }
  }
}
