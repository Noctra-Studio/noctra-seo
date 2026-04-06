const http = require('http');

const data = JSON.stringify({
  site_id: '47dbb728b34b4ea5b801daa6105a5946',
  session_id: 'test-session-123',
  event: 'pageview',
  path: '/',
  ts: new Date().toISOString(),
  device: {
    device_type: 'desktop',
    screen_width: 1920
  }
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/collect',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  res.on('data', (d) => {
    process.stdout.write(d);
  });
});

req.on('error', (error) => {
  console.error('[Error] Make sure the dev server is running on localhost:3000');
  console.error(error);
});

req.write(data);
req.end();
