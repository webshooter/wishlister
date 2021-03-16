const express = require("express");
const bodyParser = require("body-parser");
const { getWishlist } = require("./steam");

const app = express();
const port = 3000;

// eslint-disable-next-line no-console
const log = (message) => console.log(message);

app.set("view engine", "pug");
app.use(bodyParser.json());
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.render("index", {});
});

app.get("/list", (req, res) => {
  const { steamid } = req.query;
  res.render("list", { steamid });
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

  const { wishlist, errors } = await getWishlist(steamid);
  if (errors.length > 0) {
    log(`[${steamid}] Error response(s) from steam: ${errors}`);
    return res.json({
      success: false,
      message: "Make sure the Steam Id is correct and the wishlist is public and retry!",
    });
  }

  const apps = Object.entries(wishlist).map(([appid, value]) => {
    const { capsule: image, name, added } = value;
    return {
      appid,
      image,
      name,
      added,
    };
  });

  // sort by date added then by name
  apps.sort((a, b) => (
    // eslint-disable-next-line no-nested-ternary
    (a.added < b.added)
      ? 1
      // eslint-disable-next-line no-nested-ternary
      : (a.added === b.added)
        ? ((a.name < b.name) ? 1 : -1)
        : -1));

  const list = {
    success: true,
    steamid,
    wishlist: {
      count: apps.length,
      apps,
    },
  };

  return res.json(list);
});

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Example app listening at http://localhost:${port}`);
});
