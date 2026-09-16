const axios = require("axios");

async function testEvents() {
  try {
    const response = await axios.get(
      "http://localhost:5000/api/events"
    );

    console.log("Events Status:", response.status);
    console.log(response.data);
  } catch (error) {
    console.log("Events request failed");

    if (error.response) {
      console.log("Status:", error.response.status);
      console.log(error.response.data);
    } else {
      console.log(error.message);
    }
  }
}

testEvents();