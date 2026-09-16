const axios = require("axios");

const BASE_URL = "http://localhost:5000";

const test = async () => {
  try {
    // LOGIN
    const login = await axios.post(
      `${BASE_URL}/api/auth/login`,
      {
        email: "organizer@events.test",
        password: "Organizer@123"
      }
    );

    console.log("Login Status:", login.status);

    const token = login.data.token;

    const headers = {
      Authorization: `Bearer ${token}`
    };

    // CREATE
    const create = await axios.post(
      `${BASE_URL}/api/organizer/events`,
      {
        venue_id: 1,
        title: "Test Organizer Event",
        description: "Testing organizer event CRUD",
        category: "Music",
        date_time: "2026-12-20 19:00:00"
      },
      { headers }
    );

    console.log("Create Status:", create.status);
    console.log(create.data);

    const eventId = create.data.event_id;

    // UPDATE
    const update = await axios.put(
      `${BASE_URL}/api/organizer/events/${eventId}`,
      {
        venue_id: 1,
        title: "Updated Organizer Event",
        description: "Updated event description",
        category: "Music",
        date_time: "2026-12-21 19:00:00",
        status: "published"
      },
      { headers }
    );

    console.log("Update Status:", update.status);
    console.log(update.data);

    // CANCEL
    const cancel = await axios.delete(
      `${BASE_URL}/api/organizer/events/${eventId}`,
      { headers }
    );

    console.log("Cancel Status:", cancel.status);
    console.log(cancel.data);

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