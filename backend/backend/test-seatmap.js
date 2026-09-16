const axios = require("axios");

async function testSeatMap() {
  try {
    const response = await axios.get(
      "http://localhost:5000/api/events/1/seatmap"
    );

    console.log("Seat Map Status:", response.status);
    console.log(response.data);
  } catch (error) {
    console.log("Seat map request failed");

    if (error.response) {
      console.log("Status:", error.response.status);
      console.log(error.response.data);
    } else {
      console.log(error.message);
    }
  }
}

testSeatMap();