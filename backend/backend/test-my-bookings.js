const axios = require("axios");

const BASE_URL = "http://localhost:5000";

const test = async () => {
  try {
    const loginResponse = await axios.post(
      `${BASE_URL}/api/auth/login`,
      {
        email: "attendee@events.test",
        password: "Attendee@123",
      }
    );

    console.log("Login Status:", loginResponse.status);

    const token = loginResponse.data.token;

    const response = await axios.get(
      `${BASE_URL}/api/bookings/my`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log("My Bookings Status:", response.status);
    console.log(response.data);
  } catch (error) {
    console.log("Test failed");

    if (error.response) {
      console.log("Status:", error.response.status);
      console.log(error.response.data);
    } else {
      console.log(error.message);
    }
  }
};

test();