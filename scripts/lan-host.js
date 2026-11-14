import { spawn } from "node:child_process";

function run(cmd, args, label) {
  const child = spawn(process.platform === "win32" ? `${cmd}.cmd` : cmd, args, {
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  child.on("exit", (code) => {
    if (code !== 0) {
      console.error(`[${label}] exited with code ${code}`);
    }
  });
  return child;
}

console.log("Starting Shadow Ops LAN host stack...");
console.log(
  "This starts both: room server (:8787) and Vite dev server (:5173).",
);

const server = run("npm", ["run", "lan:server"], "lan:server");
const dev = run("npm", ["run", "dev"], "dev");

const shutdown = () => {
  server.kill();
  dev.kill();
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
