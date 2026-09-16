const axios = require("axios");

const BASE_URL = "http://localhost:5000/api";

async function test() {
  try {
    const login = await axios.post(`${BASE_URL}/auth/login`, {
      email: "admin@events.test",
      password: "Admin@123"
    });

    const token = login.data.token;

    const response = await axios.get(
      `${BASE_URL}/admin/organizers`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    console.log(JSON.stringify(response.data.organizers, null, 2));

  } catch (error) {
    console.log(
      "Test failed:",
      error.response?.data || error.message
    );
  }
}

test();