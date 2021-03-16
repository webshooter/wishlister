const axios = require("axios");

const baseUrl = "https://store.steampowered.com/wishlist/profiles/{{steamid}}/wishlistdata/";

const buildUrl = (base, steamid, page = 0) => `${base.replace("{{steamid}}", steamid)}?p=${page}`;

const getGamesFromList = (response) => ((response && response.data) ? response.data : {});

const responseContainsGames = (response) => {
  if (!response || !response.data || response.data.success === "2") {
    return false;
  }

  return Object.keys(response.data).length > 0;
};

const responseIsOk = (response) => (response && response.status === 200);

const getWishlist = async (steamid) => {
  const errors = [];
  let wishlist = {};
  let pageNum = 0;

  let response = await axios.get(buildUrl(baseUrl, steamid, pageNum));
  if (!responseIsOk(response)) {
    errors.push(`Steam returned status code [${response.status}]`);
  }

  while (responseIsOk(response) && responseContainsGames(response)) {
    const games = getGamesFromList(response);
    wishlist = Object.assign(wishlist, { ...games });
    pageNum += 1;

    // eslint-disable-next-line no-await-in-loop
    response = await axios.get(buildUrl(baseUrl, steamid, pageNum));
    if (!responseIsOk(response)) {
      errors.push(`Steam returned status code [${response.status}]`);
    }
  }

  return { wishlist, errors };
};

module.exports = { getWishlist };
