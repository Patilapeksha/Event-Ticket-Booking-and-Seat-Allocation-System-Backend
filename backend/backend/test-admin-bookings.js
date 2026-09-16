const axios = require("axios");

const BASE_URL = "http://localhost:5000/api";

const runTest = async () => {
  try {
    // Login as admin
    const login = await axios.post(
      `${BASE_URL}/auth/login`,
      {
        email: "admin@events.test",
        password: "Admin@123"
      }
    );

    const token = login.data.token;

    console.log("Admin Login: Successful");

    // Get all bookings
    const response = await axios.get(
      `${BASE_URL}/admin/bookings`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    console.log("Bookings Status:", response.status);

    console.log(
      JSON.stringify(response.data.bookings, null, 2)
    );

  } catch (error) {
    console.log(
      "Test failed:",
      error.response?.data || error.message
    );
  }
};

runTest();