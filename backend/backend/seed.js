const bcrypt = require("bcryptjs");
const pool = require("./db");

async function seed() {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    console.log("Starting seed...");

    // Passwords
    const adminPassword = await bcrypt.hash("Admin@123", 10);
    const organizerPassword = await bcrypt.hash("Organizer@123", 10);
    const attendeePassword = await bcrypt.hash("Attendee@123", 10);

    // Users
    await connection.query(
      `INSERT IGNORE INTO users
      (name, email, password_hash, role)
      VALUES
      (?, ?, ?, 'admin'),
      (?, ?, ?, 'organizer'),
      (?, ?, ?, 'attendee')`,
      [
        "Platform Admin",
        "admin@events.test",
        adminPassword,
        "Main Organizer",
        "organizer@events.test",
        organizerPassword,
        "Test Attendee",
        "attendee@events.test",
        attendeePassword,
      ]
    );

    // Get user IDs
    const [users] = await connection.query(
      `SELECT id, email, role FROM users
       WHERE email IN (?, ?, ?)`,
      [
        "admin@events.test",
        "organizer@events.test",
        "attendee@events.test",
      ]
    );

    const organizerUser = users.find(
      (user) => user.email === "organizer@events.test"
    );

    // Organizer
    await connection.query(
      `INSERT IGNORE INTO organizers
      (user_id, organization_name, approval_status)
      VALUES (?, ?, 'approved')`,
      [organizerUser.id, "Main Events Organization"]
    );

    const [organizers] = await connection.query(
      `SELECT id FROM organizers WHERE user_id = ?`,
      [organizerUser.id]
    );

    const organizerId = organizers[0].id;

    // Create additional organizers
    const extraOrganizers = [
      ["Organizer Two", "organizer2@events.test"],
      ["Organizer Three", "organizer3@events.test"],
    ];

    for (const [name, email] of extraOrganizers) {
      const password = await bcrypt.hash("Organizer@123", 10);

      await connection.query(
        `INSERT IGNORE INTO users
        (name, email, password_hash, role)
        VALUES (?, ?, ?, 'organizer')`,
        [name, email, password]
      );

      const [userRows] = await connection.query(
        `SELECT id FROM users WHERE email = ?`,
        [email]
      );

      await connection.query(
        `INSERT IGNORE INTO organizers
        (user_id, organization_name, approval_status)
        VALUES (?, ?, 'approved')`,
        [userRows[0].id, `${name} Events`]
      );
    }

    // Venues
    const venues = [
      ["Bangalore Arena", "Bengaluru", "MG Road, Bengaluru"],
      ["City Convention Hall", "Bengaluru", "Whitefield, Bengaluru"],
      ["Grand Event Center", "Bengaluru", "Koramangala, Bengaluru"],
      ["Music Palace", "Bengaluru", "Indiranagar, Bengaluru"],
      ["Central Auditorium", "Bengaluru", "Jayanagar, Bengaluru"],
    ];

    for (const venue of venues) {
      await connection.query(
        `INSERT INTO venues (name, city, address)
         VALUES (?, ?, ?)`,
        venue
      );
    }

    const [venueRows] = await connection.query(
      `SELECT id FROM venues ORDER BY id DESC LIMIT 5`
    );

    // Create 5 events
    const eventTitles = [
      "Bangalore Music Festival",
      "Tech Conference 2026",
      "Stand Up Comedy Night",
      "Live Bollywood Night",
      "Startup Networking Summit",
    ];

    const eventIds = [];

    for (let i = 0; i < eventTitles.length; i++) {
      const [result] = await connection.query(
        `INSERT INTO events
        (organizer_id, venue_id, title, description, category, date_time, status)
        VALUES (?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL ? DAY), 'published')`,
        [
          organizerId,
          venueRows[i].id,
          eventTitles[i],
          `Enjoy ${eventTitles[i]}`,
          i % 2 === 0 ? "Entertainment" : "Technology",
          i + 1,
        ]
      );

      eventIds.push(result.insertId);
    }

    // Create sections and seats
    for (const eventId of eventIds) {
      const sections = [
        ["VIP", 1500, 20],
        ["Regular", 800, 20],
        ["Balcony", 500, 20],
      ];

      for (const [sectionName, price, totalSeats] of sections) {
        const [sectionResult] = await connection.query(
          `INSERT INTO seat_sections
          (event_id, section_name, price, total_seats)
          VALUES (?, ?, ?, ?)`,
          [eventId, sectionName, price, totalSeats]
        );

        const sectionId = sectionResult.insertId;

        for (let seat = 1; seat <= totalSeats; seat++) {
          await connection.query(
            `INSERT INTO seats
            (section_id, seat_label, status)
            VALUES (?, ?, 'AVAILABLE')`,
            [sectionId, `${sectionName}-${seat}`]
          );
        }
      }
    }

    await connection.commit();

    console.log("Seed completed successfully");
    console.log("Admin: admin@events.test / Admin@123");
    console.log("Organizer: organizer@events.test / Organizer@123");
    console.log("Attendee: attendee@events.test / Attendee@123");
    console.log("5 events and 300 seats created.");
  } catch (error) {
    await connection.rollback();
    console.error("Seed failed:", error.message);
  } finally {
    connection.release();
  }
}

seed();