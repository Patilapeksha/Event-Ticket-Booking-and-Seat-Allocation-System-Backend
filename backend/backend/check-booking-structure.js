const pool = require("./db");

async function checkStructure() {
  try {
    const [rows] = await pool.query(
      "SHOW CREATE TABLE booking_seats"
    );

    console.log(rows[0]["Create Table"]);
  } catch (error) {
    console.error("Check failed:", error.message);
  } finally {
    await pool.end();
  }
}

checkStructure();