import { WebSocketServer } from 'ws';
import { createClient } from 'redis';

// create Redis client you'll use to save to and pull from Redis
const client = await createClient({
    url: process.env.REDIS_URL, // uses the environment var you set earlier
    })
  .on('error', err => console.log('Redis Client Error', err))
  .connect()

// if it gets here, the Redis client is connected
console.log('Redis Client Connected');

// initialize and retrieve our queue on startup
await client.del('rolls');
let rolls = client.lRange('rolls', 0, -1) || [];

// Create a new WebSockets server on port 8080
const wss = new WebSocketServer({ port: 8080 });

// this callback runs when the WebSocket server sees a connection
wss.on('connection', async function connection(ws) {
  ws.on('error', console.error);

  // this callback runs when the WebSocket server recieves a message
  ws.on('message', async function message(data) {
    console.log('received: %s', data);
    // get the queue from Redis
    rolls = await client.lRange('rolls', 0, -1) || [];
    // add the new roll onto the queue
    await client.lPush('rolls', data);
    // get the updataed queue
    rolls = await client.lRange('rolls', 0, -1) || [];
    // send the updated queue to everyone listening
    ws.send(JSON.stringify(rolls.toString()));
  });
  
  // this sends the queue on the first connection, allowing the page to show the queue before rolling
  rolls = await client.lRange('rolls', 0, -1) || [];
  ws.send(JSON.stringify(rolls.toString()));
});