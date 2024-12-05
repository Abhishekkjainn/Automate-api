const express = require('express');
const app = express();
const port = 3000;
const cors = require('cors');

const drivers = require('./drivers.json');
const locationandfares = require('./locationandfares.json');

app.use(cors());

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
  '/v1/book/:pickup/:drop/:passengers/:time/:advanced/:date/:night/:noofautos/:hostel',
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

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
