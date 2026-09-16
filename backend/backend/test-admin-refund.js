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

    const response = await axios.post(
      `${BASE_URL}/api/admin/bookings/1/refund`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    console.log("Refund Status:", response.status);
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