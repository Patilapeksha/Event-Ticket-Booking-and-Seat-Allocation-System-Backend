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

    const headers = {
      Authorization: `Bearer ${token}`
    };

    // GET USERS
    const users = await axios.get(
      `${BASE_URL}/api/admin/users`,
      { headers }
    );

    console.log("Get Users Status:", users.status);
    console.log(users.data);

    // CHANGE ATTENDEE STATUS
    const update = await axios.patch(
      `${BASE_URL}/api/admin/users/3/status`,
      {
        status: "inactive"
      },
      { headers }
    );

    console.log("Update User Status:", update.status);
    console.log(update.data);

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