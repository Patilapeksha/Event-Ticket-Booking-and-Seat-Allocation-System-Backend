const axios = require("axios");

const BASE_URL = "http://localhost:5000";

const test = async () => {
  try {
    const response = await axios.post(
      `${BASE_URL}/api/bookings/payment/webhook`,
      {
        booking_id: 1,
        payment_status: "SUCCESS",
        gateway_reference: "MOCK-WEBHOOK-001"
      }
    );

    console.log("Webhook Status:", response.status);
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