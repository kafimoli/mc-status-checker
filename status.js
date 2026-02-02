const fetch = require("node-fetch");
const fs = require("fs");

const SERVER_ADDRESS = process.env.SERVER_IP; // CHANGE THIS
const WEBHOOK_URL = process.env.WEBHOOK_URL;
const API_URL = `https://api.mcstatus.io/v2/status/java/${SERVER_ADDRESS}`;
const ROLE_ID = "1467710268124565778";

const STATUS_FILE = "last_status.json";

async function checkStatus() {
  const res = await fetch(API_URL);
  const data = await res.json();

  const currentStatus = data.online ? "online" : "offline";

  let lastStatus = null;
  if (fs.existsSync(STATUS_FILE)) {
    lastStatus = JSON.parse(fs.readFileSync(STATUS_FILE)).status;
  }

  if (currentStatus === lastStatus) return;

  let message =
    currentStatus === "online"
      ? `🟢 **Minecraft Server is ONLINE** <@&$(ROLE_ID)>\nPlayers: ${data.players.online}/${data.players.max}\nVersion: ${data.version.name_clean}`
      : `🔴 **Minecraft Server is OFFLINE <@&$(ROLE_ID)>**`;

  await fetch(WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content: message })
  });

  fs.writeFileSync(STATUS_FILE, JSON.stringify({ status: currentStatus }));
}

checkStatus();
