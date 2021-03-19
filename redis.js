const redis = require("redis");

const redisClient = redis.createClient();

redisClient.on("error", (err) => {
  // eslint-disable-next-line no-console
  console.error("Redis error: ", err);
});

module.exports = redisClient;