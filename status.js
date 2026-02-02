const fetch = require("node-fetch");

// Environment variables (from GitHub secrets)
const SERVER_ADDRESS = process.env.SERVER_IP;
const WEBHOOK_URL = process.env.WEBHOOK_URL;
const ROLE_ID = process.env.DISCORD_ROLE_ID; // optional

// API URL for mcstatus.io
const API_URL = `https://api.mcstatus.io/v2/status/java/${SERVER_ADDRESS}`;

const STATUS_FILE = "last_status.json";

async function checkStatus() {
  try {
    const res = await fetch(API_URL);
    const data = await res.json();

    // Determine status
    const currentStatus = data.online ? "online" : "offline";

    let lastStatus = null;
      if (fs.existsSync(STATUS_FILE)) {
        lastStatus = JSON.parse(fs.readFileSync(STATUS_FILE)).status;
      }

    // Always send message if first run
    if (lastStatus && currentStatus === lastStatus) return;


    // Build Discord message
    let message =
      currentStatus === "online"
        ? `🟢 **Minecraft Server is ONLINE** ${ROLE_ID ? `<@&${ROLE_ID}>` : ""}\nPlayers: ${data.players.online}/${data.players.max}\nVersion: ${data.version.name_clean}`
        : `🔴 **Minecraft Server is OFFLINE** ${ROLE_ID ? `<@&${ROLE_ID}>` : ""}`;

    // Send to Discord
    await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: message })
    });

    console.log(`Status sent: ${currentStatus}`);
  } catch (err) {
    console.error("Error fetching server status:", err);
  }
}

// Run the checker
checkStatus();
