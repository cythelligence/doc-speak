#!/usr/bin/env node

import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

const isWindows = process.platform === "win32";

console.log("🚀 Doc-Speak Setup Script");
console.log("========================\n");

// Step 1: Check Node.js version
console.log("📌 Checking Node.js version...");
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.split(".")[0].substring(1));
if (majorVersion < 20) {
  console.error("❌ Node.js v20+ is required. Current: " + nodeVersion);
  process.exit(1);
}
console.log("✅ Node.js " + nodeVersion + " OK\n");

// Step 2: Install dependencies
console.log("📦 Installing dependencies...");
try {
  execSync("npm install", { stdio: "inherit" });
  console.log("✅ Dependencies installed\n");
} catch (error) {
  console.error("❌ Failed to install dependencies");
  process.exit(1);
}

// Step 3: Create required directories
console.log("📁 Creating required directories...");
const ragDataPath = path.join(os.homedir(), "Documents", "RAG-Data");
const rawPath = path.join(ragDataPath, "raw");
const chromaPath = path.join(process.cwd(), "chroma_data");

for (const dir of [rawPath, chromaPath]) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`  ✅ Created ${dir}`);
  }
}
console.log("");

// Step 4: Setup Prisma
console.log("🗄️  Setting up Prisma database...");
try {
  execSync("npx prisma generate", { stdio: "inherit" });
  execSync("npx prisma migrate dev --name init", { stdio: "inherit" });
  console.log("✅ Prisma setup complete\n");
} catch (error) {
  console.warn("⚠️  Prisma setup warning (may be OK if already initialized)\n");
}

// Step 5: Check for Ollama
console.log("🤖 Checking for Ollama installation...");
try {
  execSync(isWindows ? "where ollama" : "which ollama", { stdio: "ignore" });
  console.log("✅ Ollama is installed\n");
} catch {
  console.warn(`⚠️  Ollama not found in PATH. Please ensure it's installed:`);
  if (isWindows) {
    console.warn("   Windows: Download from https://ollama.ai/download");
  } else if (process.platform === "darwin") {
    console.warn("   macOS: brew install ollama");
  } else {
    console.warn("   Linux: Visit https://ollama.ai/download");
  }
  console.warn("✅ Setup can continue, but Ollama must be running on localhost:11434\n");
}

// Step 6: Check Docker (optional)
console.log("🐳 Optional: Docker (for ChromaDB persistence - not required)");
try {
  execSync("docker --version", { stdio: "ignore" });
  console.log("✅ Docker is installed (optional)\n");
} catch {
  console.log("   Docker not found - local ChromaDB will be used\n");
}

// Step 7: Final instructions
console.log("✨ Setup Complete!");
console.log("==================\n");
console.log("Next steps:");
console.log("1. Ensure Ollama is running: ollama serve");
console.log("2. In another terminal, run: npm run dev");
console.log("3. Open http://localhost:3000 in your browser\n");
console.log("Configuration files:");
console.log("- .env.local: Environment variables");
console.log("- vendors.config.ts: Vendor documentation URLs");
console.log("- prisma/schema.prisma: Database schema\n");
