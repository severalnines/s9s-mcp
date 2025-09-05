import { runS9sRaw } from "../src/runner.js";

async function main() {
  console.log("Running s9s --version...");
  const v = await runS9sRaw(["--version"], 10);
  console.log("exit:", v.exitCode);
  console.log(v.stdout || v.stderr);

  console.log("\nRunning s9s --help...");
  const h = await runS9sRaw(["--help"], 10);
  console.log("exit:", h.exitCode);
  console.log(h.stdout || h.stderr);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
