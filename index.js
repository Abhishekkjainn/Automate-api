const express = require('express');
const app = express();
const port = 3000;
const cors = require('cors');
const axios = require('axios');
const drivers = require('./drivers.json');
const locationandfares = require('./locationandfares.json');

app.use(
  cors({
    origin: '*', // Allow requests from all origins, or specify specific origins if needed
  })
);

app.get('/', (req, res) => {
  res.send('Hello World!');
});

// Route for getting driver information
app.get('/v1/drivers-info', (req, res) => {
  try {
    if (!drivers || drivers.length === 0) {
      return res.status(404).json({ status: 404, message: 'No drivers found' });
    }
    res.status(200).json({
      drivers,
      status: 200,
      message: 'Drivers retrieved successfully',
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: 'An error occurred while retrieving drivers',
      error: error.message,
    });
  }
});

// Route for booking
app.get(
  '/v1/fare/pickup=:pickup/drop=:drop/passengers=:passengers/time=:time/advancebooking=:advanced/date=:date/night=:night/noofautosrequired=:noofautos/fromhostel=:hostel',
  (req, res) => {
    try {
      const { pickup, drop, passengers, night, hostel } = req.params;

      // Normalize inputs and validate
      const pickupLower = pickup.toLowerCase();
      const dropLower = drop.toLowerCase();
      const numPassengers = parseInt(passengers);
      const isNight = night.toLowerCase() === 'true';
      const isHostel = hostel.toLowerCase() === 'true';

      if (!pickup || !drop) {
        return res.status(400).json({
          status: 400,
          message: 'Both pickup and drop locations must be provided',
        });
      }

      if (isNaN(numPassengers) || numPassengers <= 0 || numPassengers > 5) {
        return res.status(400).json({
          status: 400,
          message: 'Passenger count must be a number between 1 and 5',
        });
      }

      // Find matching route (pickup and drop are interchangeable)
      const route = locationandfares.find(
        (entry) =>
          (entry.pickup.toLowerCase() === pickupLower &&
            entry.drop.toLowerCase() === dropLower) ||
          (entry.pickup.toLowerCase() === dropLower &&
            entry.drop.toLowerCase() === pickupLower)
      );

      if (!route) {
        return res.status(404).json({
          status: 404,
          message: `Route not found between ${pickup} and ${drop}`,
        });
      }

      // Mapping for determining fare key based on passenger count and night condition
      const fareMap = {
        1: isNight ? 'N2' : '2',
        2: isNight ? 'N2' : '2',
        3: isNight ? 'N3' : '3',
        4: isNight ? 'N4' : '4',
        5: isNight ? 'N5' : '5',
      };

      const fareKey = fareMap[numPassengers];
      if (!route[fareKey]) {
        return res.status(404).json({
          status: 404,
          message: `Fare not available for ${numPassengers} passengers on this route`,
        });
      }

      // Ensure fare is an integer before adding hostel surcharge
      let fare = parseInt(route[fareKey]);

      // Add hostel surcharge if applicable
      if (isHostel) {
        fare += 50; // Adding 50 Rs for hostel surcharge
      }

      const response = {
        pickup: route.pickup,
        drop: route.drop,
        fare: `${fare} Rs/-`,
        distance: route.dist,
        passengers: numPassengers,
        isNight: isNight,
        isHostel: isHostel,
        perPerson: `${fare / numPassengers} Rs/-`,
        platformFee: 15,
        status: 200,
        message: `Booking fare for ${numPassengers} passengers calculated successfully`,
      };

      return res.status(200).json(response);
    } catch (error) {
      console.error(error);
      res.status(500).json({
        status: 500,
        message: 'An internal error occurred while processing your request',
        error: error.message,
      });
    }
  }
);

const tokenid = '7210463342:AAHn7NTeEy1OEXrlFQrnba-hVCaummqtcm4';
const chatId = 1212458291;

function getDriver(driverid) {
  const driver = drivers.find((d) => d.id === driverid);
  return driver;
}
app.get(
  '/v1/book/pickup=:pickup/drop=:drop/passengers=:passengers/time=:time/advancebooking=:advanced/date=:date/night=:night/noofautosrequired=:noofautos/fromhostel=:hostel/driverid=:driverid/finalfare=:finalfare',
  async (req, res) => {
    // Normalize inputs and validate
    const pickupLower = req.params.pickup.toLowerCase();
    const dropLower = req.params.drop.toLowerCase();
    const numPassengers = parseInt(req.params.passengers);
    const isNight = req.params.night.toLowerCase() === 'true';
    const isHostel = req.params.hostel.toLowerCase() === 'true';
    const finalFare = parseInt(req.params.finalfare);
    const driverid = req.params.driverid;

    if (!pickupLower || !dropLower) {
      return res.status(400).json({
        status: 400,
        message: 'Both pickup and drop locations must be provided',
      });
    }

    if (isNaN(numPassengers) || numPassengers <= 0 || numPassengers > 5) {
      return res.status(400).json({
        status: 400,
        message: 'Passenger count must be a number between 1 and 5',
      });
    }

    // Find matching route (pickup and drop are interchangeable)
    const route = locationandfares.find(
      (entry) =>
        (entry.pickup.toLowerCase() === pickupLower &&
          entry.drop.toLowerCase() === dropLower) ||
        (entry.pickup.toLowerCase() === dropLower &&
          entry.drop.toLowerCase() === pickupLower)
    );

    if (!route) {
      return res.status(404).json({
        status: 404,
        message: `Route not found between ${req.params.pickup} and ${req.params.drop}`,
      });
    }

    // Mapping for determining fare key based on passenger count and night condition
    const fareMap = {
      1: isNight ? 'N2' : '2',
      2: isNight ? 'N2' : '2',
      3: isNight ? 'N3' : '3',
      4: isNight ? 'N4' : '4',
      5: isNight ? 'N5' : '5',
    };

    const fareKey = fareMap[numPassengers];
    if (!route[fareKey]) {
      return res.status(404).json({
        status: 404,
        message: `Fare not available for ${numPassengers} passengers on this route`,
      });
    }

    // Ensure fare is an integer before adding hostel surcharge
    let fare = parseInt(route[fareKey]);

    // Add hostel surcharge if applicable
    if (isHostel) {
      fare += 50; // Adding 50 Rs for hostel surcharge
    }

    if (fare !== finalFare) {
      return res.status(400).json({
        status: 400,
        message: `Final fare (${finalFare}) does not match the calculated fare (${fare})`,
        fareVerfied: false,
      });
    } else {
      try {
        // Get the current date and time
        const now = new Date();

        // Format the date as dd-mm-yy
        const date = now.toLocaleDateString('en-GB', {
          day: '2-digit',
          month: '2-digit',
          year: '2-digit',
        });

        // Format the time as hh:mm
        const time = now.toLocaleTimeString('en-GB', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false, // For 24-hour format
        });

        // Combine date and time
        const formattedDateTime = `Date: ${date}, Time: ${time}`;

        const message =
          'Ride Booking Details:\n' +
          'Pickup Location: ' +
          req.params.pickup +
          '\n' +
          'Drop Location: ' +
          req.params.drop +
          '\n' +
          'Passengers: ' +
          req.params.passengers +
          '\n' +
          'Booking Time: ' +
          req.params.time +
          '\n' +
          'Advanced Booking: ' +
          req.params.advanced +
          '\n' +
          'Booking Date: ' +
          req.params.date +
          '\n' +
          'Night Booking: ' +
          req.params.night +
          '\n' +
          'Number of Autos: ' +
          req.params.noofautos +
          '\n' +
          'Hostel: ' +
          req.params.hostel +
          '\n' +
          'Driver ID: ' +
          req.params.driverid +
          '\n' +
          'Driver Info: ' +
          getDriver(req.params.driverid).name +
          '\n' +
          'Final Fare: ' +
          req.params.finalfare +
          ' Rs/-' +
          '\n' +
          'bookedTime: ' +
          formattedDateTime;

        // Send the message to Telegram using the bot API
        const telegramResponse = await axios.post(
          `https://api.telegram.org/bot${tokenid}/sendMessage`,
          {
            chat_id: chatId,
            text: message,
          },
          {
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        const dataupdate = {};
        drivers.forEach((driver) => {
          dataupdate[driver.id] = driver.id === req.params.driverid ? 1 : 0;
        });
        /*************  ✨ Codeium Command ⭐  *************/
        dataupdate.Time = formattedDateTime;

        /******  55116b3b-9912-4562-9e50-aa8329359989  *******/

        console.log(dataupdate);

        const googlesheetsResponse = await axios.post(
          `	https://sheetdb.io/api/v1/t2ubs42lddol3`,
          {
            data: dataupdate,
          },
          {
            headers: {
              Accept: 'application/json',
              'Content-Type': 'application/json',
            },
          }
        );

        // Check the response from Telegram API
        if (telegramResponse.status === 200 && telegramResponse.data.ok) {
          res.status(200).json({
            status: 200,
            message: 'Ride Booked Successfully and Notification Sent',
            fareVerfied: true,
            driver: getDriver(req.params.driverid),
          });
        } else {
          throw new Error('Failed to send Telegram message');
        }
      } catch (error) {
        console.error('Error:', error.message);

        // Handle different types of errors
        if (error.response) {
          // Error response from Telegram API
          res.status(500).json({
            status: 500,
            message: 'Failed to send notification to Telegram',
            error: error.response.data,
          });
        } else if (error.request) {
          // Network error or no response received
          res.status(500).json({
            status: 500,
            message: 'No response from Telegram API',
            error: error.message,
          });
        } else {
          // Other errors (e.g., code issues)
          res.status(500).json({
            status: 500,
            message: 'An unexpected error occurred',
            error: error.message,
          });
        }
      }
    }
  }
);

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
