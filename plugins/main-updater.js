const { cmd } = require("../command");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const AdmZip = require("adm-zip");
const { setCommitHash, getCommitHash } = require("../data/updateDB");

cmd({
  pattern: "update",
  alias: ["upgrade", "sync"],
  react: "🆕",
  desc: "Update the bot to the latest version.",
  category: "misc",
  filename: __filename,
}, async (client, message, args, { reply, isOwner }) => {
  if (!isOwner) return reply("❌ This command is only for the bot owner.");

  try {
    await reply("🔍 Checking for 𝐃𝐀𝐕𝐄-𝐗𝐌𝐃 updates...");

    const repoOwner = "giftedsession";
    const repoName = "DAVE-XMD";

    // Get latest commit hash from your repo
    const { data: commitData } = await axios.get(
      `https://api.github.com/repos/${repoOwner}/${repoName}/commits/main`
    );
    const latestCommitHash = commitData.sha;

    const currentHash = await getCommitHash();

    if (latestCommitHash === currentHash) {
      return reply("✅ Your 𝐃𝐀𝐕𝐄-𝐗𝐌𝐃 bot is already up-to-date!");
    }

    await reply("🚀 Downloading update for 𝐃𝐀𝐕𝐄-𝐗𝐌𝐃...");

    // Download the zip file from GitHub
    const zipPath = path.join(__dirname, "latest.zip");
    const { data: zipData } = await axios.get(
      `https://github.com/${repoOwner}/${repoName}/archive/refs/heads/main.zip`,
      { responseType: "arraybuffer" }
    );
    fs.writeFileSync(zipPath, zipData);

    // Extract the ZIP file
    await reply("📦 Extracting update files...");
    const extractPath = path.join(__dirname, "latest");
    const zip = new AdmZip(zipPath);
    zip.extractAllTo(extractPath, true);

    // Copy over files
    await reply("🔄 Updating project files...");
    const sourcePath = path.join(extractPath, `${repoName}-main`);
    const destinationPath = path.join(__dirname, "..");
    copyFolderSync(sourcePath, destinationPath);

    // Store latest commit hash
    await setCommitHash(latestCommitHash);

    // Cleanup
    fs.unlinkSync(zipPath);
    fs.rmSync(extractPath, { recursive: true, force: true });

    await reply("✅ 𝐃𝐀𝐕𝐄-𝐗𝐌𝐃 has been updated successfully. Restarting...");

    process.exit(0);
  } catch (error) {
    console.error("Update error:", error);
    return reply("❌ Update failed. Please check logs or try manually.");
  }
});

// Helper to copy files while preserving specific config
function copyFolderSync(source, target) {
  if (!fs.existsSync(target)) {
    fs.mkdirSync(target, { recursive: true });
  }

  const items = fs.readdirSync(source);
  for (const item of items) {
    const srcPath = path.join(source, item);
    const destPath = path.join(target, item);

    if (["config.js", "app.json"].includes(item)) {
      console.log(`Skipping ${item} to preserve settings.`);
      continue;
    }

    if (fs.lstatSync(srcPath).isDirectory()) {
      copyFolderSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
          }
