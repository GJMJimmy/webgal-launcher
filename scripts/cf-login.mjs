#!/usr/bin/env node
/**
 * Opens Cloudflare's OAuth login in the local browser, using a callback server
 * bound to IPv4 (127.0.0.1) on a free port.
 *
 * `wrangler login` on Windows can bind the callback to IPv6 `::1` only, and its
 * browser-launch helper can fail in restricted VM environments. This wrapper
 * fixes both: it picks an available IPv4 port, parses the OAuth URL printed by
 * Wrangler, and opens that URL with a known local browser (or the OS opener).
 */
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { createServer } from "node:net";
import { resolve } from "node:path";

const root = process.cwd();
const wranglerCli = resolve(root, "node_modules/wrangler/wrangler-dist/cli.js");
const preferredPorts = [8977, 8978, 8988, 8997, 9786, 9787];
const portCandidates = [
  ...preferredPorts,
  ...Array.from({ length: 100 }, (_, index) => 9000 + index),
];
const noOpen = process.env.CF_LOGIN_NO_OPEN === "1";

if (!existsSync(wranglerCli)) {
  console.error("找不到本地 Wrangler。请先运行 `pnpm install` 或 `npm install`。");
  process.exit(1);
}

if (process.env.CLOUDFLARE_API_TOKEN) {
  console.error(
    "检测到 CLOUDFLARE_API_TOKEN。API Token 模式不需要 OAuth 登录；\n" +
      "如果要改用浏览器登录，请先清除该环境变量，再重新运行。",
  );
  process.exit(1);
}

function isPortFree(port) {
  return new Promise((resolvePort) => {
    const server = createServer();
    server.once("error", () => resolvePort(false));
    server.listen(port, "127.0.0.1", () => {
      server.close(() => resolvePort(true));
    });
  });
}

async function findFreePort() {
  for (const port of portCandidates) {
    if (await isPortFree(port)) return port;
  }
  return null;
}

function stripAnsi(value) {
  return value.replace(/\u001b\[[0-9;]*m/g, "");
}

function findBrowser() {
  if (process.platform === "darwin") return { command: "open", args: [] };
  if (process.platform === "linux") return { command: "xdg-open", args: [] };
  if (process.platform !== "win32") return null;

  const programFiles = process.env.ProgramFiles ?? "C:\\Program Files";
  const programFilesX86 = process.env["ProgramFiles(x86)"] ?? "C:\\Program Files (x86)";
  const localAppData = process.env.LOCALAPPDATA ?? "";
  const candidates = [
    `${programFilesX86}\\Microsoft\\Edge\\Application\\msedge.exe`,
    `${programFiles}\\Microsoft\\Edge\\Application\\msedge.exe`,
    `${programFiles}\\Google\\Chrome\\Application\\chrome.exe`,
    `${programFilesX86}\\Google\\Chrome\\Application\\chrome.exe`,
    `${localAppData}\\Google\\Chrome\\Application\\chrome.exe`,
    `${programFiles}\\Mozilla Firefox\\firefox.exe`,
    `${programFiles}\\BraveSoftware\\Brave-Browser\\Application\\brave.exe`,
  ];
  const browser = candidates.find((candidate) => existsSync(candidate));
  return browser ? { command: browser, args: [] } : null;
}

function openUrl(url) {
  const browser = findBrowser();
  if (!browser) {
    if (process.platform === "win32") {
      const child = spawn("cmd.exe", ["/c", "start", "", url], {
        detached: true,
        stdio: "ignore",
        windowsHide: true,
      });
      child.on("error", () => {
        console.warn("浏览器启动失败，请手动复制上方链接到浏览器打开。");
      });
      child.unref();
      return;
    }
    console.warn("没有找到可用的浏览器，请手动打开上方链接。");
    return;
  }
  const child = spawn(browser.command, [...browser.args, url], {
    detached: true,
    stdio: "ignore",
    windowsHide: false,
  });
  child.on("error", () => {
    console.warn("浏览器启动失败，请手动复制上方链接到浏览器打开。");
  });
  child.unref();
}

const port = await findFreePort();
if (!port) {
  console.error("没有找到可用的本地回调端口，请关闭占用 8977–9787 的程序后重试。");
  process.exit(1);
}

console.log(`\n正在启动 Cloudflare 浏览器登录（回调 127.0.0.1:${port}）…\n`);

const wrangler = spawn(
  process.execPath,
  [wranglerCli, "login", "--callback-host", "127.0.0.1", "--callback-port", String(port), "--browser=false"],
  {
    cwd: root,
    env: process.env,
    stdio: ["inherit", "pipe", "pipe"],
    windowsHide: false,
  },
);

let opened = false;
let buffered = "";

function handleOutput(chunk, isError = false) {
  const text = chunk.toString();
  if (isError) process.stderr.write(text);
  else process.stdout.write(text);

  buffered = stripAnsi(buffered + text);
  const match = buffered.match(/https:\/\/dash\.cloudflare\.com\/oauth2\/auth\?[^\s]+/);
  if (match && !opened) {
    opened = true;
    const url = match[0];
    console.log(`\n已选择回调端口 ${port}。`);
    if (noOpen) {
      console.log("CF_LOGIN_NO_OPEN=1，跳过自动打开浏览器。");
      return;
    }
    openUrl(url);
    console.log("已尝试打开系统浏览器；如果页面没有出现，请手动复制上方链接。\n");
  }
}

wrangler.stdout.on("data", (chunk) => handleOutput(chunk, false));
wrangler.stderr.on("data", (chunk) => handleOutput(chunk, true));

wrangler.on("error", (error) => {
  console.error(`无法启动 Wrangler：${error.message}`);
  process.exit(1);
});

wrangler.on("exit", (code) => {
  if (code === 0) {
    console.log("\nCloudflare 登录完成。");
  } else if (!opened) {
    console.error(
      "\n登录进程未能启动。若提示 EACCES / 端口被占用，请关闭残留的 Wrangler 进程后重试。",
    );
  }
  process.exit(code ?? 1);
});

process.on("SIGINT", () => wrangler.kill("SIGINT"));
process.on("SIGTERM", () => wrangler.kill("SIGTERM"));
