const axios = require("axios");

async function testLogin() {
  try {
    const response = await axios.post(
      "http://localhost:5000/api/auth/login",
      {
        email: "admin@events.test",
        password: "Admin@123",
      }
    );

    console.log("Login Status:", response.status);
    console.log(response.data);
  } catch (error) {
    console.log("Login failed");

    if (error.response) {
      console.log("Status:", error.response.status);
      console.log(error.response.data);
    } else {
      console.log(error.message);
    }
  }
}

testLogin();