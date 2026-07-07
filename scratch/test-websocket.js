const WebSocket = require('ws');

const url = 'ws://localhost:3000/api/telephony/stream?business_id=608def7d-3117-4275-b0d1-27f625185ce3';
console.log(`Connecting to: ${url}`);

const ws = new WebSocket(url);

ws.on('open', () => {
  console.log('Connection opened successfully!');
  
  // Send start event
  const startEvent = {
    event: 'start',
    streamSid: 'test-stream-sid',
    callSid: 'test-call-sid'
  };
  ws.send(JSON.stringify(startEvent));
  console.log('Sent start event.');
});

ws.on('message', (data) => {
  console.log(`Received response: ${data}`);
});

ws.on('error', (err) => {
  console.error('Socket error:', err.message);
});

ws.on('close', (code, reason) => {
  console.log(`Connection closed: code=${code}, reason=${reason}`);
});
