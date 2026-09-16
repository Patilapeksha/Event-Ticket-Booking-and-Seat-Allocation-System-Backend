const axios = require("axios");

const API = "http://localhost:5000";

const test = async () => {
  try {
    // Login as organizer
    const loginResponse = await axios.post(
      `${API}/api/auth/login`,
      {
        email: "organizer@events.test",
        password: "Organizer@123"
      }
    );

    const token = loginResponse.data.token;

    console.log("Organizer Login: Successful");

    // Get payouts
    const payoutResponse = await axios.get(
      `${API}/api/organizer/payouts`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    console.log("Payout Status:", payoutResponse.status);
    console.log("Payouts:", payoutResponse.data);

  } catch (error) {
    console.error(
      "Test failed:",
      error.response?.data || error.message
    );
  }
};

test();