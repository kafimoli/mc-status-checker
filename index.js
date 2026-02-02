const fetch = require("node-fetch");
const fs = require("fs");

const SERVER_ADDRESS = process.env.SERVER_IP;
const WEBHOOK_URL = process.env.WEBHOOK_URL;
const ROLE_ID = process.env.DISCORD_ROLE_ID; // optional

if (!SERVER_ADDRESS || !WEBHOOK_URL) {
  console.error("Missing environment variables");
  process.exit(1);
}

const API_URL = `https://api.mcstatus.io/v2/status/java/${SERVER_ADDRESS}`;
const STATUS_FILE = "last_status.json";

// ===== Status check =====
async function checkStatus() {
  try {
    const res = await fetch(API_URL);
    let data;
    try {
      data = await res.json();
    } catch {
      console.log("API returned invalid JSON, skipping this check");
      return;
    }

    const currentStatus = data.online ? "online" : "offline";

    let lastStatus = null;
    if (fs.existsSync(STATUS_FILE)) {
      lastStatus = JSON.parse(fs.readFileSync(STATUS_FILE)).status;
    }

    if (currentStatus === lastStatus) {
      console.log("No status change:", currentStatus);
      return;
    }

    // Status changed → build message
    const emoji = currentStatus === "online" ? "🟢" : "🔴";
    let message = `${emoji} **Minecraft Server is ${currentStatus.toUpperCase()}**`;

    // Add role mention
    if (ROLE_ID) {
      message = message + `<@&${ROLE_ID}> `;
    }

    // Add extra info if online
    if (currentStatus === "online") {
      message += `\nPlayers: ${data.players.online}/${data.players.max}`;
      message += `\nVersion: ${data.version.name_clean}`;
    }

    // Send to Discord
    await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: message })
    });

    fs.writeFileSync(STATUS_FILE, JSON.stringify({ status: currentStatus }));
    console.log("Status changed:", currentStatus);
  } catch (err) {
    console.error("Error in checkStatus:", err.message);
  }
}

// ===== Run loop =====
checkStatus(); // first check
setInterval(checkStatus, 60 * 1000); // every 60 seconds
