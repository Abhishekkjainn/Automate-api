require('dotenv').config();
const express = require('express');
const app = express();
const port = 3000;
const cors = require('cors');
const axios = require('axios');
const drivers = require('./drivers.json');
const locationandfares = require('./locationandfares.json');
const { db } = require('./firebase');

app.use(cors());

const projectId = process.env.GOOGLE_PROJECT_ID;
const privateKeyId = process.env.GOOGLE_PRIVATE_KEY_ID;
const privateKey = process.env.GOOGLE_PRIVATE_KEY;
const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
const clientId = process.env.GOOGLE_CLIENT_ID;
const authUri = process.env.GOOGLE_AUTH_URI;
const tokenUri = process.env.GOOGLE_TOKEN_URI;
const authProviderCertUrl = process.env.GOOGLE_AUTH_PROVIDER_X509_CERT_URL;
const clientCertUrl = process.env.GOOGLE_CLIENT_X509_CERT_URL;
const universeDomain = process.env.GOOGLE_UNIVERSE_DOMAIN;

app.get('/', (req, res) => {
  res.send(`<!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Automate Vellore API Documentation</title>
      <style>
          body {
              font-family: 'Arial', sans-serif;
              background-color: #f4f4f9;
              color: #333;
              margin: 0;
              padding: 20px;
          }
          .container {
              max-width: 900px;
              margin: auto;
              background: #fff;
              padding: 20px;
              border-radius: 10px;
              box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
          }
          h1, h2, h3 {
              color: #2c3e50;
          }
          pre {
              background: #ecf0f1;
              padding: 15px;
              border-radius: 5px;
              overflow-x: auto;
              font-size: 14px;
          }
          code {
              background: #dcdde1;
              padding: 2px 5px;
              border-radius: 4px;
          }
          .route {
              margin-bottom: 30px;
              padding: 15px;
              border-left: 5px solid #3498db;
              background: #f9f9f9;
              border-radius: 5px;
          }
          .status {
              font-weight: bold;
              color: green;
          }
          .error {
              font-weight: bold;
              color: red;
          }
      </style>
  </head>
  <body>
      <div class="container">
          <h1>Automate Vellore API Documentation</h1>
  
          <h2>Base URL</h2>
          <p><code>http://automateapi.vercel.app</code></p>
  
          <h2>Endpoints</h2>
  
          <div class="route">
              <h3>1. Get All Drivers</h3>
              <p><strong>Endpoint:</strong> <code>/v1/drivers-info</code></p>
              <p><strong>Method:</strong> GET</p>
              <p><strong>Response:</strong></p>
              <pre>{ "drivers": [...], "status": 200, "message": "Drivers retrieved successfully" }</pre>
          </div>
  
          <div class="route">
              <h3>2. Get Fare for a Booking</h3>
              <p><strong>Endpoint:</strong> <code>/v1/fare/pickup=:pickup/drop=:drop/passengers=:passengers/time=:time/...</code></p>
              <p><strong>Method:</strong> GET</p>
              <p><strong>Response:</strong></p>
              <pre>{ "pickup": "Location A", "drop": "Location B", "fare": "100 Rs/-", ... }</pre>
          </div>
  
          <div class="route">
              <h3>3. Book a Ride</h3>
              <p><strong>Endpoint:</strong> <code>/v1/book/pickup=:pickup/drop=:drop/...</code></p>
              <p><strong>Method:</strong> GET</p>
              <p><strong>Response:</strong></p>
              <pre>{ "status": 200, "message": "Ride Booked Successfully", ... }</pre>
          </div>
  
          <div class="route">
              <h3>4. Get Rides for a Driver</h3>
              <p><strong>Endpoint:</strong> <code>/v1/driver/:driverid/rides</code></p>
              <p><strong>Method:</strong> GET</p>
              <p><strong>Description:</strong> Fetches all rides of a particular driver along with earnings and balance due.</p>
              <p><strong>Response:</strong></p>
              <pre>{
      "driverName": "John Doe",
      "driverid": "123",
      "totalRides": 10,
      "ridesPaid": 7,
      "balanceToBePaid": 30,
      "rideDetails": [...]
  }</pre>
          </div>
  
          <h2>Error Handling</h2>
          <p>All errors include a <code>status</code> code and a descriptive <code>message</code>. Common error codes:</p>
          <ul>
              <li><code>400</code>: Bad request (e.g., missing or invalid parameters)</li>
              <li><code>404</code>: Not found (e.g., route or driver not found)</li>
              <li><code>500</code>: Internal server error</li>
          </ul>
      </div>
  </body>
  </html>
  
  `);
});

// Route for getting driver information
// app.get('/v1/drivers-info', (req, res) => {
//   try {
//     if (!drivers || drivers.length === 0) {
//       return res.status(404).json({ status: 404, message: 'No drivers found' });
//     }
//     res.status(200).json({
//       drivers,
//       status: 200,
//       message: 'Drivers retrieved successfully',
//     });
//   } catch (error) {
//     res.status(500).json({
//       status: 500,
//       message: 'An error occurred while retrieving drivers',
//       error: error.message,
//     });
//   }
// });

app.get('/v1/drivers-info', async (req, res) => {
  try {
    // Fetch drivers collection from Firestore
    const driversSnapshot = await db.collection('Drivers').get();

    if (driversSnapshot.empty) {
      return res.status(404).json({ status: 404, message: 'No drivers found' });
    }

    // Map Firestore documents to driver objects
    const drivers = driversSnapshot.docs.map((doc) => doc.data());

    res.status(200).json({
      drivers,
      status: 200,
      message: 'Drivers retrieved successfully',
    });
  } catch (error) {
    console.error('Error fetching drivers:', error);
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

// function getDriver(driverid) {
//   const driver = drivers.find((d) => d.id === driverid);
//   return driver;
// }
// app.get(
//   '/v1/book/pickup=:pickup/drop=:drop/passengers=:passengers/time=:time/advancebooking=:advanced/date=:date/night=:night/noofautosrequired=:noofautos/fromhostel=:hostel/driverid=:driverid/finalfare=:finalfare/passengername=:passengername/passengerphone=:passengerphone',
//   async (req, res) => {
//     // Normalize inputs and validate
//     const pickupLower = req.params.pickup.toLowerCase();
//     const dropLower = req.params.drop.toLowerCase();
//     const numPassengers = parseInt(req.params.passengers);
//     const isNight = req.params.night.toLowerCase() === 'true';
//     const isHostel = req.params.hostel.toLowerCase() === 'true';
//     const finalFare = parseInt(req.params.finalfare);
//     const driverid = req.params.driverid;
//     const passengername = req.params.passengername;
//     const passengerphone = req.params.passengerphone;

//     if (!pickupLower || !dropLower) {
//       return res.status(400).json({
//         status: 400,
//         message: 'Both pickup and drop locations must be provided',
//       });
//     }

//     if (isNaN(numPassengers) || numPassengers <= 0 || numPassengers > 5) {
//       return res.status(400).json({
//         status: 400,
//         message: 'Passenger count must be a number between 1 and 5',
//       });
//     }

//     if (!passengername || !passengerphone) {
//       return res.status(400).json({
//         status: 400,
//         message: 'Passenger name and phone number must be provided',
//       });
//     }

//     // Find matching route (pickup and drop are interchangeable)
//     const route = locationandfares.find(
//       (entry) =>
//         (entry.pickup.toLowerCase() === pickupLower &&
//           entry.drop.toLowerCase() === dropLower) ||
//         (entry.pickup.toLowerCase() === dropLower &&
//           entry.drop.toLowerCase() === pickupLower)
//     );

//     if (!route) {
//       return res.status(404).json({
//         status: 404,
//         message: `Route not found between ${req.params.pickup} and ${req.params.drop}`,
//       });
//     }

//     // Mapping for determining fare key based on passenger count and night condition
//     const fareMap = {
//       1: isNight ? 'N2' : '2',
//       2: isNight ? 'N2' : '2',
//       3: isNight ? 'N3' : '3',
//       4: isNight ? 'N4' : '4',
//       5: isNight ? 'N5' : '5',
//     };

//     const fareKey = fareMap[numPassengers];
//     if (!route[fareKey]) {
//       return res.status(404).json({
//         status: 404,
//         message: `Fare not available for ${numPassengers} passengers on this route`,
//       });
//     }

//     // Ensure fare is an integer before adding hostel surcharge
//     let fare = parseInt(route[fareKey]);

//     // Add hostel surcharge if applicable
//     if (isHostel) {
//       fare += 50; // Adding 50 Rs for hostel surcharge
//     }

//     if (fare !== finalFare) {
//       return res.status(400).json({
//         status: 400,
//         message: `Final fare (${finalFare}) does not match the calculated fare (${fare})`,
//         fareVerfied: false,
//       });
//     } else {
//       try {
//         // Get the current date and time
//         const now = new Date();

//         // Format the date as dd-mm-yy
//         const date = now.toLocaleDateString('en-GB', {
//           day: '2-digit',
//           month: '2-digit',
//           year: '2-digit',
//         });

//         // Format the time as hh:mm
//         const time = now.toLocaleTimeString('en-GB', {
//           hour: '2-digit',
//           minute: '2-digit',
//           hour12: false, // For 24-hour format
//         });

//         // Combine date and time
//         const formattedDateTime = `Date: ${date}, Time: ${time}`;

//         const message =
//           'Ride Booking Details:\n' +
//           'Pickup Location: ' +
//           req.params.pickup +
//           '\n' +
//           'Drop Location: ' +
//           req.params.drop +
//           '\n' +
//           'Passengers: ' +
//           req.params.passengers +
//           '\n' +
//           'Booking Time: ' +
//           req.params.time +
//           '\n' +
//           'Advanced Booking: ' +
//           req.params.advanced +
//           '\n' +
//           'Booking Date: ' +
//           req.params.date +
//           '\n' +
//           'Night Booking: ' +
//           req.params.night +
//           '\n' +
//           'Number of Autos: ' +
//           req.params.noofautos +
//           '\n' +
//           'Hostel: ' +
//           req.params.hostel +
//           '\n' +
//           'Driver ID: ' +
//           req.params.driverid +
//           '\n' +
//           'Driver Info: ' +
//           getDriver(req.params.driverid).name +
//           '\n' +
//           'Final Fare: ' +
//           req.params.finalfare +
//           ' Rs/-' +
//           '\n' +
//           'bookedTime: ' +
//           formattedDateTime +
//           '\n' +
//           'Passenger Name: ' +
//           passengername +
//           '\n' +
//           'passengerphone: ' +
//           passengerphone;

//         // Send the message to Telegram using the bot API
//         const telegramResponse = await axios.post(
//           `https://api.telegram.org/bot${tokenid}/sendMessage`,
//           {
//             chat_id: chatId,
//             text: message,
//           },
//           {
//             headers: {
//               'Content-Type': 'application/json',
//             },
//           }
//         );

//         const dataupdate = {};
//         drivers.forEach((driver) => {
//           dataupdate[driver.id] = driver.id === req.params.driverid ? 1 : 0;
//         });

//         dataupdate.Time = formattedDateTime;

//         console.log(dataupdate);

//         const googlesheetsResponse = await axios.post(
//           `	https://sheetdb.io/api/v1/t2ubs42lddol3`,
//           {
//             data: dataupdate,
//           },
//           {
//             headers: {
//               Accept: 'application/json',
//               'Content-Type': 'application/json',
//             },
//           }
//         );

//         // Check the response from Telegram API
//         if (telegramResponse.status === 200 && telegramResponse.data.ok) {
//           res.status(200).json({
//             status: 200,
//             message: 'Ride Booked Successfully and Notification Sent',
//             fareVerfied: true,
//             driver: getDriver(req.params.driverid),
//             pickup: req.params.pickup,
//             drop: req.params.drop,
//             passengers: req.params.passengers,
//             time: req.params.time,
//             date: req.params.date,
//             night: req.params.night,
//             hostel: req.params.hostel,
//             finalfare: req.params.finalfare,
//           });
//         } else {
//           throw new Error('Failed to send Telegram message');
//         }
//       } catch (error) {
//         console.error('Error:', error.message);

//         // Handle different types of errors
//         if (error.response) {
//           // Error response from Telegram API
//           res.status(500).json({
//             status: 500,
//             message: 'Failed to send notification to Telegram',
//             error: error.response.data,
//           });
//         } else if (error.request) {
//           // Network error or no response received
//           res.status(500).json({
//             status: 500,
//             message: 'No response from Telegram API',
//             error: error.message,
//           });
//         } else {
//           // Other errors (e.g., code issues)
//           res.status(500).json({
//             status: 500,
//             message: 'An unexpected error occurred',
//             error: error.message,
//           });
//         }
//       }
//     }
//   }
// );

function getDriver(driverid) {
  const driver = drivers.find((d) => d.id === driverid);
  return driver;
}

app.get(
  '/v1/book/pickup=:pickup/drop=:drop/passengers=:passengers/time=:time/advancebooking=:advanced/date=:date/night=:night/noofautosrequired=:noofautos/fromhostel=:hostel/driverid=:driverid/finalfare=:finalfare/passengername=:passengername/passengerphone=:passengerphone',
  async (req, res) => {
    // Normalize inputs and validate
    const pickupLower = req.params.pickup.toLowerCase();
    const dropLower = req.params.drop.toLowerCase();
    const numPassengers = parseInt(req.params.passengers);
    const isNight = req.params.night.toLowerCase() === 'true';
    const isHostel = req.params.hostel.toLowerCase() === 'true';
    const finalFare = parseInt(req.params.finalfare);
    const driverid = req.params.driverid;
    const passengername = req.params.passengername;
    const passengerphone = req.params.passengerphone;

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

    if (!passengername || !passengerphone) {
      return res.status(400).json({
        status: 400,
        message: 'Passenger name and phone number must be provided',
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
          formattedDateTime +
          '\n' +
          'Passenger Name: ' +
          passengername +
          '\n' +
          'passengerphone: ' +
          passengerphone;

        // Fetch existing rides for the driver from Firestore
        const driverRef = db.collection('Rides').doc(driverid);
        const driverDoc = await driverRef.get();

        let rides = [];

        // If no rides exist, create an empty array
        if (driverDoc.exists) {
          rides = driverDoc.data().Rides || [];
        }

        // Add the new ride to the list
        const newRide = {
          pickup: req.params.pickup,
          drop: req.params.drop,
          passengers: req.params.passengers,
          time: req.params.time,
          date: req.params.date,
          night: req.params.night,
          hostel: req.params.hostel,
          finalFare: req.params.finalfare,
          bookedTime: formattedDateTime,
          passengerName: passengername,
          passengerPhone: passengerphone,
          paymentStatus: false,
          cancelled: false,
        };

        rides.push(newRide);

        // Update Firestore document with the new list of rides
        await driverRef.set(
          {
            Rides: rides,
          },
          { merge: true }
        );

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

        dataupdate.Time = formattedDateTime;

        const googlesheetsResponse = await axios.post(
          `https://sheetdb.io/api/v1/t2ubs42lddol3`,
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
            pickup: req.params.pickup,
            drop: req.params.drop,
            passengers: req.params.passengers,
            time: req.params.time,
            date: req.params.date,
            night: req.params.night,
            hostel: req.params.hostel,
            finalfare: req.params.finalfare,
          });
        } else {
          throw new Error('Failed to send Telegram message');
        }
      } catch (error) {
        console.error('Error:', error.message);

        // Handle different types of errors
        if (error.response) {
          res.status(500).json({
            status: 500,
            message: 'Failed to send notification to Telegram',
            error: error.response.data,
          });
        } else if (error.request) {
          res.status(500).json({
            status: 500,
            message: 'No response from Telegram API',
            error: error.message,
          });
        } else {
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

app.get('/v1/rides/driverid=:driverid', async (req, res) => {
  try {
    const driverid = req.params.driverid;

    // Fetch the driver document from Firebase
    const driverRef = db.collection('Rides').doc(driverid);
    const driverDoc = await driverRef.get();

    if (!driverDoc.exists) {
      return res.status(404).json({
        status: 404,
        message: `Driver with ID ${driverid} not found`,
      });
    }

    // Get rides data
    const driverData = driverDoc.data();
    const rides = driverData.Rides || [];

    let totalRides = rides.length;
    let totalBalanceToBePaid = 0;

    // Iterate through each ride to calculate balance due
    rides.forEach((ride) => {
      if (ride.paymentStatus === false && ride.cancelled !== true) {
        totalBalanceToBePaid += 10; // Add 10 Rs for each unpaid and non-cancelled ride
      }
    });

    // Calculate ridesPaid as totalRides - (rides contributing to balanceToBePaid)
    let ridesPaid = totalRides - totalBalanceToBePaid / 10;

    // Fetch driver name from another source (e.g., from the `drivers` array or Firebase)
    const driverName = getDriver(driverid)?.name || 'Unknown Driver';

    // Construct the response data
    const response = {
      driverName: driverName,
      driverid: driverid,
      totalRides: totalRides,
      ridesPaid: ridesPaid,
      rideDetails: rides,
      balanceToBePaid: totalBalanceToBePaid,
    };

    // Send the response back
    res.status(200).json({
      status: 200,
      data: response,
    });
  } catch (error) {
    console.error('Error fetching driver rides:', error.message);
    res.status(500).json({
      status: 500,
      message: 'An error occurred while fetching driver rides',
      error: error.message,
    });
  }
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
