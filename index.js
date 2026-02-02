const fetch = require("node-fetch");
const fs = require("fs");

const SERVER_ADDRESS = process.env.SERVER_IP;
const WEBHOOK_URL = process.env.WEBHOOK_URL;

if (!SERVER_ADDRESS || !WEBHOOK_URL) {
  console.error("Missing environment variables");
  process.exit(1);
}

const API_URL = `https://api.mcstatus.io/v2/status/java/${SERVER_ADDRESS}`;
const STATUS_FILE = "last_status.json";

async function checkStatus() {
  try {
    const res = await fetch(API_URL);
    const data = await res.json();

    const currentStatus = data.online ? "online" : "offline";

    let lastStatus = null;
    if (fs.existsSync(STATUS_FILE)) {
      lastStatus = JSON.parse(fs.readFileSync(STATUS_FILE)).status;
    }

    if (currentStatus === lastStatus) {
      console.log("No status change:", currentStatus);
      return;
    }

    const message =
      currentStatus === "online"
        ? `🟢 **Minecraft Server is ONLINE**`
        : `🔴 **Minecraft Server is OFFLINE**`;

    await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: message })
    });

    fs.writeFileSync(STATUS_FILE, JSON.stringify({ status: currentStatus }));
    console.log("Status changed:", currentStatus);
  } catch (err) {
    console.error("Error:", err.message);
  }
}

checkStatus();
setInterval(checkStatus, 60 * 1000);
