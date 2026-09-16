const fs = require("fs");
const mysql = require("mysql2/promise");
require("dotenv").config();

async function setupDatabase() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      multipleStatements: true,
    });

    const schema = fs.readFileSync("./schema.sql", "utf8");

    await connection.query(schema);

    console.log("Database tables created successfully");

    await connection.end();
  } catch (error) {
    console.error("Database setup failed:", error.message);
  }
}

setupDatabase();