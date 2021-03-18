const express = require("express");
const bodyParser = require("body-parser");
const { steam } = require("./steam");

const app = express();
const port = process.env.PORT || 3000;

// eslint-disable-next-line no-console
const log = (message) => console.log(message);

app.set("view engine", "pug");
app.use(bodyParser.json());
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.render("index", {});
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

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Example app listening at http://localhost:${port}`);
});
