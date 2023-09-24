const express = require('express');
const redis = require('redis');
const axios = require('axios');
const redisClient = redis.createClient();
let redisClientReady = false;

const app = express();

redisClient.on('error', (err) => {
  console.error("Something went wrong");
  redisClient.disconnect();
});

redisClient.on('ready', () => {
  console.log('ready');
  redisClientReady = true;
});

redisClient.on('end', () => {
  console.log('ended');
  redisClientReady = false;
});

app.get("/photos", async (req, res) => {
  let cachedPhotos = [];

  if (redisClientReady ) {
    cachedPhotos = await redisClient.get("photos");
  }
  
  if (cachedPhotos.length) {
    console.log("cache hit");
    const photos = JSON.parse(cachedPhotos);
    res.send(photos);
  } else {
    
    const photos = await axios('https://jsonplaceholder.typicode.com/photos', {
      params: {
        albumId: req.query.albumId
      }
    }).then(res => res.data);
    if (redisClientReady ) {
      console.log("cache write");
      await redisClient.setEx('photos', 10000, JSON.stringify(photos));
    }    
    res.send(photos);
  }
});

app.listen(9000, async () => {
  await redisClient.connect();
  console.log("Listening on 9000");
});
