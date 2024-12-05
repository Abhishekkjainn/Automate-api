
# Automate-API by Abhishek Jain

## Project Overview

This project is an **Express.js API** built for a driver booking system. It provides endpoints to retrieve driver information and calculate fares based on routes, number of passengers, and other parameters. The API supports features like route validation, passenger count validation, night fares, hostel surcharges, and more.

### Features:
- **Driver Info**: Retrieve driver data (name, phone, and location).
- **Booking Service**: Calculate fares for a specific route with customizable options (e.g., number of passengers, night fare, hostel surcharge).
- **CORS Support**: The API supports Cross-Origin Resource Sharing (CORS) for handling requests from multiple domains.
  
### Table of Contents
1. [Installation](#installation)
2. [API Endpoints](#api-endpoints)
    - [Get Drivers Info](#get-drivers-info)
    - [Book Ride](#book-ride)
3. [Error Codes and Responses](#error-codes-and-responses)
4. [CORS Configuration](#cors-configuration)
5. [Do's and Don'ts](#dos-and-donts)
6. [License](#license)
7. [Author Information](#author-information)

---

## Installation

### Prerequisites
- Node.js installed
- npm (Node package manager)

### Steps to Setup the API
1. Clone the repository:
    ```bash
    git clone https://github.com/yourusername/express-api.git
    cd express-api
    ```
2. Install dependencies:
    ```bash
    npm install
    ```

3. Start the Express server:
    ```bash
    npm start
    ```

    The API will be hosted on [http://localhost:3000](http://localhost:3000).

---

## API Endpoints

### **1. Get Drivers Info**

**GET** `/v1/drivers-info`

This endpoint fetches the list of available drivers.

#### Request Example:
```bash
GET http://localhost:3000/v1/drivers-info
```

#### Response Example:
```json
{
  "drivers": [
    {
      "name": "John Doe",
      "phone": "+1234567890",
      "location": "Downtown"
    },
    {
      "name": "Jane Smith",
      "phone": "+0987654321",
      "location": "Uptown"
    }
  ],
  "status": 200,
  "message": "Drivers retrieved successfully"
}
```

#### Error Responses:
- **404 Not Found**: No drivers found in the system.

    ```json
    {
      "status": 404,
      "message": "No drivers found"
    }
    ```

- **500 Internal Server Error**: Server issues or unknown errors.

    ```json
    {
      "status": 500,
      "message": "An error occurred while retrieving drivers",
      "error": "Error details"
    }
    ```

---

### **2. Book Ride**

**GET** `/v1/book/:pickup/:drop/:passengers/:time/:advanced/:date/:night/:noofautos/:hostel`

This endpoint calculates the fare for booking a ride between the provided pickup and drop locations. It supports additional parameters such as number of passengers, night fare, and hostel surcharge.

#### Request Example:
```bash
GET http://localhost:3000/v1/book/downtown/uptown/3/12:00/yes/2024-12-25/false/2/true
```

#### Parameters:
- `pickup`: Pickup location.
- `drop`: Drop location.
- `passengers`: Number of passengers (1–5).
- `time`: Ride time (HH:MM format).
- `advanced`: Whether the ride is booked in advance (yes/no).
- `date`: Ride date (YYYY-MM-DD format).
- `night`: Whether it is a night ride (true/false).
- `noofautos`: Number of autos required.
- `hostel`: Whether the ride involves a hostel (true/false).

#### Response Example:
```json
{
  "pickup": "Downtown",
  "drop": "Uptown",
  "fare": "200 Rs/-",
  "distance": "15 km",
  "passengers": 3,
  "isNight": false,
  "isHostel": true,
  "perPerson": "66.67 Rs/-",
  "platformFee": 15,
  "status": 200,
  "message": "Booking fare for 3 passengers calculated successfully"
}
```

#### Error Responses:
- **400 Bad Request**: Invalid input (e.g., invalid number of passengers, missing parameters).

    ```json
    {
      "status": 400,
      "message": "Passenger count must be a number between 1 and 5"
    }
    ```

- **404 Not Found**: Route not found.

    ```json
    {
      "status": 404,
      "message": "Route not found between downtown and uptown"
    }
    ```

- **500 Internal Server Error**: Server issues or unknown errors.

    ```json
    {
      "status": 500,
      "message": "An internal error occurred while processing your request",
      "error": "Error details"
    }
    ```

---

## Error Codes and Responses

### Common Error Codes:

- **400 Bad Request**: The request is malformed or contains invalid data.
- **404 Not Found**: The requested resource could not be found.
- **500 Internal Server Error**: An error occurred on the server while processing the request.

### Error Response Format:
```json
{
  "status": <status_code>,
  "message": "<error_message>",
  "error": "<detailed_error_message>"
}
```

---

## CORS Configuration

This API uses the `cors` middleware to enable **Cross-Origin Resource Sharing (CORS)**, allowing the API to accept requests from any origin.

By default, **all origins** are allowed:
```javascript
app.use(
  cors({
    origin: '*', // Allows all origins, modify as necessary
  })
);
```

---

## Do's and Don'ts

### Do's:
- Always provide valid and complete parameters in the request.
- Use proper HTTP status codes in responses (e.g., `200` for success, `400` for bad requests).
- Provide clear error messages to help users troubleshoot.

### Don'ts:
- Do not send incomplete requests (e.g., missing required parameters).
- Do not hardcode sensitive data or credentials in the code.
- Do not ignore error handling; always handle exceptions properly.

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## More Features Incoming

## Author Information

This project was developed by **Abhishek Jain**, a passionate software developer and the founder of **Ahiru.in**. You can explore my work and portfolio on my [personal website](https://abhishekjainn.vercel.app).

Feel free to reach out or contribute to the project via GitHub!

```

This documentation includes the entire overview of your API, installation steps, endpoints, error handling, CORS configuration, and best practices for using and contributing to the project. You can copy this into your `README.md` file and customize as needed.
