const axios = require("axios");

async function testLock() {
  try {
    // Login as attendee
    const loginResponse = await axios.post(
      "http://localhost:5000/api/auth/login",
      {
        email: "attendee@events.test",
        password: "Attendee@123",
      }
    );

    const token = loginResponse.data.token;

    console.log("Attendee Login Status:", loginResponse.status);

    // Lock seats 1 and 2
    const lockResponse = await axios.post(
      "http://localhost:5000/api/seats/lock",
      {
        seat_ids: [5, 6],
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log("Lock Status:", lockResponse.status);
    console.log(lockResponse.data);
  } catch (error) {
    console.log("Seat lock failed");

    if (error.response) {
      console.log("Status:", error.response.status);
      console.log(error.response.data);
    } else {
      console.log(error.message);
    }
  }
}

testLock();