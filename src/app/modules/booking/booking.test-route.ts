// Test route without validation to isolate the issue
import { Router } from 'express';
import auth from '../../middleware/auth';
import { bookingController } from './booking.controller';

const router = Router();

// Test endpoint without validation - just echo the request body
router.post('/test-create', auth('admin', 'user'), (req, res) => {
  console.log('=== TEST CREATE ENDPOINT ===');
  console.log('req.body:', req.body);
  console.log('typeof req.body:', typeof req.body);
  console.log('req.headers:', req.headers);
  console.log('content-type:', req.headers['content-type']);
  console.log('============================');
  
  res.json({
    success: true,
    message: 'Test endpoint - no validation',
    receivedData: {
      body: req.body,
      bodyType: typeof req.body,
      bodyKeys: req.body ? Object.keys(req.body) : null,
      contentType: req.headers['content-type'],
      headers: req.headers
    }
  });
});

// Test endpoint without auth or validation
router.post('/test-no-auth', (req, res) => {
  console.log('=== TEST NO AUTH ENDPOINT ===');
  console.log('req.body:', req.body);
  console.log('typeof req.body:', typeof req.body);
  console.log('req.headers:', req.headers);
  console.log('content-type:', req.headers['content-type']);
  console.log('==============================');
  
  res.json({
    success: true,
    message: 'Test endpoint - no auth, no validation',
    receivedData: {
      body: req.body,
      bodyType: typeof req.body,
      bodyKeys: req.body ? Object.keys(req.body) : null,
      contentType: req.headers['content-type']
    }
  });
});

export const testBookingRoutes = router;
