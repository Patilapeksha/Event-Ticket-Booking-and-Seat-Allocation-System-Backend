const axios = require("axios");

async function testCheckout() {
  try {
    // Login as attendee
    const loginResponse = await axios.post(
      "http://localhost:5000/api/auth/login",
      {
        email: "attendee@events.test",
        password: "Attendee@123",
      }
    );

    const token = loginResponse.data.token;

    console.log("Login Status:", loginResponse.status);

    // Checkout locked seats
    const checkoutResponse = await axios.post(
      "http://localhost:5000/api/bookings/checkout",
      {
        seat_ids: [5, 6],
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log("Checkout Status:", checkoutResponse.status);
    console.log(checkoutResponse.data);
  } catch (error) {
    console.log("Checkout failed");

    if (error.response) {
      console.log("Status:", error.response.status);
      console.log(error.response.data);
    } else {
      console.log(error.message);
    }
  }
}

testCheckout();