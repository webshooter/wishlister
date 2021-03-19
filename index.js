require("dotenv").config();

const express = require("express");
const bodyParser = require("body-parser");
const session = require("express-session");
const passport = require("passport");
const OpenIDStrategy = require("passport-openid").Strategy;
const RedisStore = require("connect-redis")(session);
const redisClient = require("./redis");

const { steam } = require("./steam");

const app = express();
const port = process.env.PORT || 3000;

// eslint-disable-next-line no-console
const log = (message) => console.log(message);

const SteamStrategy = new OpenIDStrategy({
  providerURL: "http://steamcommunity.com/openid",
  stateless: true,
  returnURL: "http://localhost:3000/auth/openid/return",
  realm: "http://localhost:3000/",
},
(async (identifier, done) => {
  try {
    const steamid = identifier.match(/\d+$/)[0];
    // eslint-disable-next-line no-console
    console.log(`redis:set:${identifier}:${steamid}`);
    redisClient.set(identifier, steamid);

    return done(null, {
      identifier,
      steamid,
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err);
    return done(err);
  }
}));

passport.use(SteamStrategy);

passport.serializeUser((user, done) => {
  done(null, user.identifier);
});

passport.deserializeUser(async (identifier, done) => {
  try {
    const steamid = redisClient.get(identifier);
    return done(null, {
      identifier,
      steamid,
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err);
    return done(err);
  }
});

app.set("view engine", "pug");
app.use(bodyParser.json());
app.use(express.static("public"));
app.use(session({
  secret: process.env.SESSION_SECRET,
  name: "_oidexample",
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false },
  store: new RedisStore({
    client: redisClient,
    ttl: 86400,
  }),
  // store: new RedisStore({
  //   host: process.env.REDIS_URL,
  //   port: 6379,
  //   client: redisClient,
  //   ttl: 86400,
  // }),
}));
app.use(passport.initialize());
app.use(passport.session());

app.get("/", (req, res) => {
  const { steamid } = req.query;
  res.render("index", { steamid });
});

app.get("/wishlist", (req, res) => {
  const { steamid } = req.query;
  res.render("wishlist", { steamid });
});

app.get("/gameslist", (req, res) => {
  const { steamid } = req.query;
  res.render("gameslist", { steamid });
});

app.get("/api/getlist", async (req, res) => {
  const { steamid } = req.query;
  log(`[${steamid}] Getting wishlist info`);

  if (!steamid) {
    return res.json({
      success: false,
      message: "Invalid or missing Steam Id!",
    });
  }

  const { wishlist, errors } = await steam(steamid).getWishlist();
  if (errors && errors.length > 0) {
    log(`[${steamid}] Error response(s) from steam: ${errors}`);
    return res.json({
      success: false,
      message: "<b>Steam returned an error!</b><br />Make sure the Steam Id is correct and the wishlist is public and <a href='/'>retry</a>!",
    });
  }

  const apps = Object
    .entries(wishlist)
    .map(([appid, value]) => {
      const { capsule: image, name, added } = value;
      return {
        appid,
        image,
        name,
        added,
      };
    });

  // sort by date added
  apps.sort((a, b) => ((a.added < b.added) ? 1 : -1));

  return res.json({
    success: true,
    steamid,
    wishlist: {
      count: apps.length,
      apps,
    },
  });
});

app.get("/api/getgames", async (req, res) => {
  const { steamid } = req.query;
  log(`[${steamid}] Getting games list info`);

  if (!steamid) {
    return res.json({
      success: false,
      message: "Invalid or missing Steam Id!",
    });
  }

  const {
    steamid: id,
    nickname,
    games,
    errors,
  } = await steam(steamid).getGamesList();
  if (errors && errors.length > 0) {
    log(`[${steamid}] Error response(s) from steam: ${errors}`);
    return res.json({
      success: false,
      message: "<b>Steam returned an error!</b><br />Make sure the Steam Id is correct and the wishlist is public and <a href='/'>retry</a>!",
    });
  }

  // sort by name
  games.sort((a, b) => ((a.name < b.name) ? -1 : 1));

  return res.json({
    success: true,
    steamid: id,
    nickname,
    games,
  });
});

app.post("/auth/openid", passport.authenticate("openid"));

app.get("/auth/openid/return", passport.authenticate("openid"),
  (request, response) => {
    if (request.user) {
      response.redirect(`/?steamid=${request.user.steamid}`);
    } else {
      response.redirect("/?failed");
    }
  });

app.get("/auth/logout", (request, response) => {
  request.logout();
  response.redirect("/");
});

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Example app listening at http://localhost:${port}`);
});
