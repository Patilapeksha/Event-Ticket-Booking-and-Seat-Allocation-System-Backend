const axios = require("axios");

const BASE_URL = "http://localhost:5000";

const test = async () => {
  try {
    const loginResponse = await axios.post(
      `${BASE_URL}/api/auth/login`,
      {
        email: "admin@events.test",
        password: "Admin@123",
      }
    );

    console.log("Admin Login Status:", loginResponse.status);

    const token = loginResponse.data.token;

    const response = await axios.post(
      `${BASE_URL}/api/admin/organizers/2/approve`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log("Approval Status:", response.status);
    console.log(response.data);
  } catch (error) {
    console.log("Approval failed");

    if (error.response) {
      console.log("Status:", error.response.status);
      console.log(error.response.data);
    } else {
      console.log(error.message);
    }
  }
};

test();