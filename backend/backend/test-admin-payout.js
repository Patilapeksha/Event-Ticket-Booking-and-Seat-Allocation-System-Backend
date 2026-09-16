const axios = require("axios");

const BASE_URL = "http://localhost:5000";

const test = async () => {
  try {
    // ADMIN LOGIN
    const login = await axios.post(
      `${BASE_URL}/api/auth/login`,
      {
        email: "admin@events.test",
        password: "Admin@123"
      }
    );

    console.log("Login Status:", login.status);

    const token = login.data.token;

    // CREATE PAYOUT FOR ORGANIZER 2
    const response = await axios.post(
      `${BASE_URL}/api/admin/organizers/1/payout`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    console.log("Payout Status:", response.status);
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