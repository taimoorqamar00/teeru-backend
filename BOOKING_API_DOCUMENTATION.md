# Booking API Documentation

This document provides comprehensive documentation for the booking CRUD API endpoints.

## Base URL
```
/api/v1/bookings
```

## Authentication
All booking endpoints require authentication. Include the JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Endpoints

### 1. Create Booking
**POST** `/api/v1/bookings`

Creates a new booking with the provided details.

**Request Body:**
```json
{
  "customerInfo": {
    "name": "John Doe",
    "phone": "+1234567890",
    "email": "john@example.com"
  },
  "customerType": "walk-in",
  "bayNumber": 1,
  "duration": 2,
  "totalAmount": 50000,
  "paymentMethod": "wave",
  "bookingDate": "2024-04-20T10:00:00.000Z",
  "startTime": "14:00",
  "status": "pending",
  "notes": "Customer requested additional equipment"
}
```

**Response:**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Booking created successfully",
  "data": {
    "_id": "663a1b2c3d4e5f6a7b8c9d0e",
    "customerInfo": {
      "name": "John Doe",
      "phone": "+1234567890",
      "email": "john@example.com"
    },
    "customerType": "walk-in",
    "bayNumber": 1,
    "duration": 2,
    "totalAmount": 50000,
    "paymentMethod": "wave",
    "bookingDate": "2024-04-20T10:00:00.000Z",
    "startTime": "14:00",
    "status": "pending",
    "notes": "Customer requested additional equipment",
    "isDeleted": false,
    "createdAt": "2024-04-20T12:00:00.000Z",
    "updatedAt": "2024-04-20T12:00:00.000Z",
    "__v": 0
  }
}
```

### 2. Get All Bookings (Admin)
**GET** `/api/v1/bookings`

Retrieves all bookings with pagination and filtering options.

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10, max: 100)
- `sortBy`: Field to sort by (bookingDate, startTime, customerInfo.name, totalAmount, status, createdAt)
- `sortOrder`: Sort order (asc, desc)
- `status`: Filter by status (pending, confirmed, cancelled, completed)
- `customerType`: Filter by customer type (member, walk-in)
- `bayNumber`: Filter by bay number (1, 2, 3, 4)
- `dateFrom`: Filter bookings from date (YYYY-MM-DD)
- `dateTo`: Filter bookings to date (YYYY-MM-DD)
- `search`: Search by customer name or phone

**Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Bookings retrieved successfully",
  "data": [
    {
      "_id": "663a1b2c3d4e5f6a7b8c9d0e",
      "customerInfo": {
        "name": "John Doe",
        "phone": "+1234567890",
        "email": "john@example.com"
      },
      "customerType": "walk-in",
      "bayNumber": 1,
      "duration": 2,
      "totalAmount": 50000,
      "paymentMethod": "wave",
      "bookingDate": "2024-04-20T10:00:00.000Z",
      "startTime": "14:00",
      "status": "pending",
      "notes": "Customer requested additional equipment",
      "isDeleted": false,
      "createdAt": "2024-04-20T12:00:00.000Z",
      "updatedAt": "2024-04-20T12:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPage": 1
  }
}
```

### 3. Get My Bookings (User)
**GET** `/api/v1/bookings/my`

Retrieves bookings for the authenticated user. Same query parameters as getAllBookings.

### 4. Get Booking by ID
**GET** `/api/v1/bookings/:id`

Retrieves a specific booking by its ID.

**Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Booking retrieved successfully",
  "data": {
    "_id": "663a1b2c3d4e5f6a7b8c9d0e",
    "customerInfo": {
      "name": "John Doe",
      "phone": "+1234567890",
      "email": "john@example.com"
    },
    "customerType": "walk-in",
    "bayNumber": 1,
    "duration": 2,
    "totalAmount": 50000,
    "paymentMethod": "wave",
    "bookingDate": "2024-04-20T10:00:00.000Z",
    "startTime": "14:00",
    "status": "pending",
    "notes": "Customer requested additional equipment",
    "isDeleted": false,
    "createdAt": "2024-04-20T12:00:00.000Z",
    "updatedAt": "2024-04-20T12:00:00.000Z"
  }
}
```

### 5. Update Booking
**PATCH** `/api/v1/bookings/:id`

Updates an existing booking. Only include the fields you want to update.

**Request Body:**
```json
{
  "customerInfo": {
    "name": "Jane Doe",
    "phone": "+1234567891"
  },
  "status": "confirmed",
  "notes": "Updated booking information"
}
```

**Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Booking updated successfully",
  "data": {
    "_id": "663a1b2c3d4e5f6a7b8c9d0e",
    "customerInfo": {
      "name": "Jane Doe",
      "phone": "+1234567891",
      "email": "john@example.com"
    },
    "customerType": "walk-in",
    "bayNumber": 1,
    "duration": 2,
    "totalAmount": 50000,
    "paymentMethod": "wave",
    "bookingDate": "2024-04-20T10:00:00.000Z",
    "startTime": "14:00",
    "status": "confirmed",
    "notes": "Updated booking information",
    "isDeleted": false,
    "createdAt": "2024-04-20T12:00:00.000Z",
    "updatedAt": "2024-04-20T13:00:00.000Z"
  }
}
```

### 6. Delete/Cancel Booking
**DELETE** `/api/v1/bookings/:id`

Cancels a booking (soft delete). The booking status is set to 'cancelled' and isDeleted is set to true.

**Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Booking cancelled successfully",
  "data": {
    "_id": "663a1b2c3d4e5f6a7b8c9d0e",
    "status": "cancelled",
    "isDeleted": true,
    "updatedAt": "2024-04-20T14:00:00.000Z"
  }
}
```

### 7. Check Bay Availability
**POST** `/api/v1/bookings/check-availability`

Checks if a bay is available for a specific time slot.

**Query Parameters:**
- `bayNumber`: Bay number (1-4)
- `date`: Date to check (YYYY-MM-DD)

**Request Body:**
```json
{
  "startTime": "14:00",
  "duration": 2,
  "excludeId": "663a1b2c3d4e5f6a7b8c9d0e" // Optional: exclude this booking from availability check
}
```

**Response (Available):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Bay is available for the selected time slot",
  "data": {
    "available": true
  }
}
```

**Response (Not Available):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Bay is not available for the selected time slot",
  "data": {
    "available": false,
    "conflictingBookings": [
      {
        "_id": "663a1b2c3d4e5f6a7b8c9d0f",
        "startTime": "13:00",
        "duration": 2,
        "customerInfo": {
          "name": "Other Customer"
        }
      }
    ]
  }
}
```

### 8. Get Today's Bookings
**GET** `/api/v1/bookings/today`

Retrieves all bookings for today.

### 9. Get Upcoming Bookings
**GET** `/api/v1/bookings/upcoming`

Retrieves upcoming bookings.

**Query Parameters:**
- `limit`: Maximum number of bookings to return (default: 10)

### 10. Get Booking Statistics
**GET** `/api/v1/bookings/statistics`

Retrieves booking statistics.

**Query Parameters:**
- `dateFrom`: Start date for statistics (YYYY-MM-DD)
- `dateTo`: End date for statistics (YYYY-MM-DD)

**Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Booking statistics retrieved successfully",
  "data": {
    "totalBookings": 150,
    "confirmedBookings": 120,
    "cancelledBookings": 20,
    "completedBookings": 100,
    "totalRevenue": 7500000,
    "averageBookingValue": 50000
  }
}
```

### 11. Get Bookings by Date Range
**GET** `/api/v1/bookings/date-range`

Retrieves bookings within a specific date range.

**Query Parameters:**
- `dateFrom`: Start date (YYYY-MM-DD) - Required
- `dateTo`: End date (YYYY-MM-DD) - Required
- Additional filters: status, customerType, bayNumber, search

## Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation error message",
  "errorMessages": [
    {
      "path": "customerInfo.name",
      "message": "Customer name is required"
    }
  ]
}
```

## Validation Rules

### Customer Information
- `name`: Required, max 100 characters
- `phone`: Required, valid phone number format
- `email`: Optional, valid email format

### Booking Details
- `customerType`: Required, must be 'member' or 'walk-in'
- `bayNumber`: Required, must be 1, 2, 3, or 4
- `duration`: Required, must be 1, 2, or 3 (hours)
- `totalAmount`: Required, positive number
- `paymentMethod`: Required, must be 'wave' or 'orange-money'
- `bookingDate`: Required, valid date
- `startTime`: Required, HH:mm format (24-hour)
- `status`: Optional, must be 'pending', 'confirmed', 'cancelled', or 'completed'
- `notes`: Optional, max 500 characters

## Business Logic

### Bay Availability
- The system prevents double bookings for the same bay and time slot
- Time slots are calculated based on start time and duration
- Overlapping bookings are automatically detected and prevented

### Pricing
- Default rate: 25,000 FCFA per hour per bay
- Total amount is automatically calculated if not provided
- Rates can be customized in the service layer

### Booking Status Flow
1. `pending` - Initial status when booking is created
2. `confirmed` - Booking is confirmed and paid
3. `completed` - Booking session is completed
4. `cancelled` - Booking is cancelled (soft delete)

### Soft Delete
- Bookings are never permanently deleted
- `isDeleted` flag is set to true
- `status` is set to 'cancelled'
- Bookings with `isDeleted: true` are excluded from most queries

## Usage Examples

### Creating a Booking from Frontend Form
```javascript
// Based on your frontend form data
const bookingData = {
  customerInfo: {
    name: formData.customerName,
    phone: formData.customerPhone,
    email: formData.customerEmail
  },
  customerType: formData.customerType, // 'member' or 'walk-in'
  bayNumber: formData.selectedBay, // 1, 2, 3, or 4
  duration: formData.duration, // 1, 2, or 3
  totalAmount: formData.totalAmount, // 25000, 50000, or 75000
  paymentMethod: formData.paymentMethod, // 'wave' or 'orange-money'
  bookingDate: new Date(),
  startTime: formData.startTime, // "14:00", "16:00", etc.
  status: 'pending'
};

fetch('/api/v1/bookings', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${authToken}`
  },
  body: JSON.stringify(bookingData)
})
.then(response => response.json())
.then(data => console.log('Booking created:', data));
```

### Checking Availability Before Booking
```javascript
// Check if bay is available before creating booking
const availabilityCheck = {
  bayNumber: selectedBay,
  date: selectedDate,
  startTime: selectedTime,
  duration: selectedDuration
};

fetch(`/api/v1/bookings/check-availability?bayNumber=${availabilityCheck.bayNumber}&date=${availabilityCheck.date}`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${authToken}`
  },
  body: JSON.stringify({
    startTime: availabilityCheck.startTime,
    duration: availabilityCheck.duration
  })
})
.then(response => response.json())
.then(data => {
  if (data.data.available) {
    // Proceed with booking creation
    createBooking(bookingData);
  } else {
    // Show error message about unavailable time slot
    alert('This time slot is already booked. Please select another time.');
  }
});
```
