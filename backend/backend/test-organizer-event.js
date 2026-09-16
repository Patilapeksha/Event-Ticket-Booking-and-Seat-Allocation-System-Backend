const axios = require("axios");

async function testOrganizerEvent() {
  try {
    const login = await axios.post(
      "http://localhost:5000/api/auth/login",
      {
        email: "organizer@events.test",
        password: "Organizer@123"
      }
    );

    const token = login.data.token;

    const response = await axios.get(
      "http://localhost:5000/api/organizer/events",
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    console.log("Status:", response.status);
    console.log("Events:", response.data);
  } catch (error) {
    console.log(
      "Test failed:",
      error.response?.data || error.message
    );
  }
}

testOrganizerEvent();