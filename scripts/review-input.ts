import { createInterface } from "node:readline/promises";
import { Writable } from "node:stream";

export async function reviewAccountInput() {
  if (!process.stdin.isTTY)
    throw new Error("Run this command in an interactive local terminal");
  let hidden = false;
  const output = new Writable({
    write(chunk, encoding, callback) {
      if (!hidden) process.stdout.write(chunk, encoding);
      callback();
    },
  });
  const prompt = createInterface({
    input: process.stdin,
    output,
    terminal: true,
  });
  try {
    const username = (await prompt.question("Username: ")).trim();
    const email = (await prompt.question("Email: ")).trim();
    const name = (await prompt.question("Display name: ")).trim();
    process.stdout.write("Password (hidden, at least 12 characters): ");
    hidden = true;
    const password = await prompt.question("");
    hidden = false;
    process.stdout.write("\n");
    if (
      !/^[a-zA-Z0-9._]{3,30}$/.test(username) ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      !name ||
      password.length < 12 ||
      password.length > 128
    )
      throw new Error("Invalid account input; nothing was saved");
    return {
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      name,
      password,
    };
  } finally {
    hidden = false;
    prompt.close();
  }
}
