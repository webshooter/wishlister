/* eslint-disable no-underscore-dangle */
const axios = require("axios");
const xmlConverter = require("xml-js");

const steam = (steamid, options = {}) => {
  if (!steamid) {
    return null;
  }

  const wishlistBaseUrl = options.wishlistBaseUrl || "https://store.steampowered.com/wishlist/profiles/{{steamid}}/wishlistdata/";
  const gamesListBaseUrl = options.gamesListBaseUrl || "https://steamcommunity.com/profiles/{{steamid}}/games?tab=all&xml=1";
  const xmlParseOpts = { compact: true, spaces: 2 };

  const responseIsOk = (response) => (response && response.status === 200);
  const responseHasData = (response) => (!(!response || !response.data || response.data.success === "2"));
  const convertGameListXml = (xml, opts = xmlParseOpts) => xmlConverter.xml2js(xml, opts);
  const parseGamesList = ({ steamID64, steamID, games }) => {
    if (!steamID64 || !steamID || !games) {
      return {
        errors: ["Missing required data"],
      };
    }

    const { _text: id } = steamID64;
    const { _cdata: nickname } = steamID;
    const { game: gameList } = games;

    const gamesInfo = gameList.map(({
      appID,
      name,
      logo,
      storeLink,
      hoursOnRecord,
    }) => ({
      appid: appID._text,
      appname: name._cdata,
      appicon: logo._cdata,
      link: storeLink._cdata,
      allhours: (hoursOnRecord ? hoursOnRecord._text : 0),
    }));

    return {
      nickname,
      steamid: id,
      games: gamesInfo,
    };
  };

  const getWishlist = async () => {
    const errors = [];
    const buildUrl = (page) => `${wishlistBaseUrl.replace("{{steamid}}", steamid)}?p=${page}`;
    const responseHasGames = (response) => (
      responseIsOk(response)
      && responseHasData(response)
      && Object.keys(response.data).length > 0);

    let wishlist = {};
    let pageNum = 0;

    try {
      let response = await axios.get(buildUrl(pageNum));
      if (!responseIsOk(response)) {
        errors.push(`Steam returned status code [${response.status}]`);
      }

      while (responseHasGames(response)) {
        const { data: games } = response;
        wishlist = Object.assign(wishlist, { ...games });
        pageNum += 1;

        // eslint-disable-next-line no-await-in-loop
        response = await axios.get(buildUrl(pageNum));
        if (!responseIsOk(response)) {
          errors.push(`Steam returned status code [${response.status}]`);
        }
      }
    } catch (err) {
      errors.push(`Steam returned an error [${err.message}]`);
    }

    return {
      wishlist,
      errors,
    };
  };

  const getGamesList = async () => {
    const url = gamesListBaseUrl.replace("{{steamid}}", steamid);
    const errorMessage = `Error requesting games list from Steam with url ${url}`;
    let response = null;

    try {
      response = await axios.get(url);
    } catch (err) {
      return {
        error: errorMessage,
      };
    }

    if (!response.data) {
      return {
        error: errorMessage,
      };
    }

    const gamesListInfo = convertGameListXml(response.data);

    return parseGamesList(gamesListInfo.gamesList);
  };

  return {
    getWishlist,
    getGamesList,
  };
};

module.exports = {
  steam,
};
