const pool = require("./db");

async function updateCategory() {
  try {
    await pool.query(
      `UPDATE events
       SET category = 'Entertainment'
       WHERE title = 'Live Bollywood Night'`
    );

    console.log("Live Bollywood Night updated to Entertainment");
  } catch (error) {
    console.error("Update failed:", error.message);
  } finally {
    await pool.end();
  }
}

updateCategory();