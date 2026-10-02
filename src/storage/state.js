const fs = require("node:fs/promises");
const path = require("node:path");

async function readState(file) {
  try { return JSON.parse(await fs.readFile(file, "utf8")); }
  catch (error) {
    if (error.code === "ENOENT") return {};
    throw error;
  }
}
async function writeState(file, state) {
  await fs.mkdir(path.dirname(file), { recursive: true, mode: 0o700 });
  const temp = `${file}.tmp`;
  await fs.writeFile(temp, JSON.stringify(state, null, 2), { mode: 0o600 });
  await fs.rename(temp, file);
}
module.exports = { readState, writeState };
