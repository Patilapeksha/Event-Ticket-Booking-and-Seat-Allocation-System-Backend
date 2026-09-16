const axios = require("axios");

async function testLockAgain() {
  try {
    const loginResponse = await axios.post(
      "http://localhost:5000/api/auth/login",
      {
        email: "attendee@events.test",
        password: "Attendee@123",
      }
    );

    const token = loginResponse.data.token;

    const response = await axios.post(
      "http://localhost:5000/api/seats/lock",
      {
        seat_ids: [1, 2],
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log("Status:", response.status);
    console.log(response.data);
  } catch (error) {
    console.log("Second lock attempt result:");

    if (error.response) {
      console.log("Status:", error.response.status);
      console.log(error.response.data);
    } else {
      console.log(error.message);
    }
  }
}

testLockAgain();