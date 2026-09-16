const pool = require("./db");

const addSeats = async () => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // Create VIP section for Event 8
    const [sectionResult] = await connection.query(
      `
      INSERT INTO seat_sections
      (event_id, section_name, price, total_seats)
      VALUES (?, ?, ?, ?)
      `,
      [8, "VIP", 1500, 20]
    );

    const sectionId = sectionResult.insertId;

    // Create 20 seats
    for (let i = 1; i <= 20; i++) {
      await connection.query(
        `
        INSERT INTO seats
        (section_id, seat_label, status)
        VALUES (?, ?, 'AVAILABLE')
        `,
        [sectionId, `VIP-${i}`]
      );
    }

    await connection.commit();

    console.log("Seat section and 20 seats created successfully.");
    console.log("Section ID:", sectionId);
  } catch (error) {
    await connection.rollback();
    console.error("Failed:", error.message);
  } finally {
    connection.release();
  }
};

addSeats();