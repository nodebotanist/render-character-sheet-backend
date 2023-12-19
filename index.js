import { WebSocketServer } from 'ws';
import { createClient } from 'redis';

const client = await createClient({
    url: process.env.REDIS_URL,
    })
  .on('error', err => console.log('Redis Client Error', err))
  .connect()

console.log('Redis Client Connected');

const wss = new WebSocketServer({ port: 8080 });
await client.del('rolls');
let rolls = client.lRange('rolls', 0, -1) || [];

wss.on('connection', async function connection(ws) {
  ws.on('error', console.error);

  ws.on('message', async function message(data) {
    console.log('received: %s', data);
    rolls = await client.lRange('rolls', 0, -1) || [];
    console.log(rolls);
    client.lPush('rolls', data);
    rolls = await client.lRange('rolls', 0, -1) || [];
    ws.send(JSON.stringify(rolls.toString()));
  });
  
  rolls = await client.lRange('rolls', 0, -1) || [];
  ws.send(JSON.stringify(rolls.toString()));
});