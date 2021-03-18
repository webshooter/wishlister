// eslint-disable-next-line no-unused-vars
function getWishlistClick() {
  const steamid = document.querySelector("#steamid").value;
  if (!steamid || steamid === "") {
    return;
  }
  document.location.href = `/wishlist?steamid=${steamid}`;
}

// eslint-disable-next-line no-unused-vars
function getGamesListClick() {
  const steamid = document.querySelector("#steamid").value;
  if (!steamid || steamid === "") {
    return;
  }
  document.location.href = `/gameslist?steamid=${steamid}`;
}

function hideElement(selector, hide = true) {
  const element = document.querySelector(selector);
  if (element) {
    if (hide) {
      element.classList.add("hide");
    } else {
      element.classList.remove("hide");
    }
  }
}

// eslint-disable-next-line no-unused-vars
function hideLoader() {
  hideElement("#loader");
}

function showError(message) {
  const error = document.querySelector("#error");
  error.innerHTML = message;
  hideElement("#error", false);
}

function showListElement() {
  hideElement("#list", false);
}

function formatDateAdded(date) {
  if (!date) {
    return "";
  }

  const month = date.getMonth() + 1;
  const day = date.getDate();
  const year = date.getFullYear();
  return `${year}/${month}/${day}`;
}

function isMobile() {
  return window
    .matchMedia("only screen and (max-width: 760px)")
    .matches;
}

// eslint-disable-next-line no-unused-vars
function getQsParam(param, url = window.location.href) {
  const paramName = param.replace(/[[\]]/g, "\\$&");
  const re = new RegExp(`[?&]${paramName}(=([^&#]*)|&|#|$)`);
  const results = re.exec(url);

  if (!results) {
    return null;
  }

  if (!results[2]) {
    return "";
  }

  return decodeURIComponent(results[2].replace(/\+/g, " "));
}

// eslint-disable-next-line no-unused-vars
async function getWishlist(steamid) {
  const {
    success,
    wishlist,
    message,
    steamid: id,
  } = await fetch(`/api/getlist?steamid=${steamid}`)
    .then((response) => response.json());

  if (success) {
    // eslint-disable-next-line no-console
    console.log(`Found ${wishlist.apps.length} apps on wishlist for steamid ${steamid}`);
    return {
      steamid: id,
      wishlist,
    };
  }

  // eslint-disable-next-line no-console
  console.error("error", message);
  return {
    error: message,
  };
}

// eslint-disable-next-line no-unused-vars
async function getGamesList(steamid) {
  const {
    message,
    success,
    games,
    nickname,
    steamid: id,
  } = await fetch(`/api/getgames?steamid=${steamid}`)
    .then((response) => response.json());

  if (success) {
    // eslint-disable-next-line no-console
    console.log(`Found ${games.length} apps in games list for steamid ${steamid}`);
    return {
      gameslist: {
        steamid: id,
        nickname,
        games,
      },
    };
  }

  // eslint-disable-next-line no-console
  console.error("error", message);
  return {
    error: message,
  };
}

// eslint-disable-next-line no-unused-vars
function updateTotalCount(count) {
  const totalCount = document.querySelector("#count");
  if (totalCount) {
    totalCount.innerHTML = `Found ${count} apps for`;
  }
}

function tableHeaderRow() {
  const row = document.createElement("div");
  row.classList.add("table-row");

  const iconHeader = document.createElement("div");
  iconHeader.classList.add("header");
  iconHeader.classList.add("icon");
  iconHeader.style.fontWeight = "700";
  iconHeader.style.paddingLeft = "16px";

  const appidHeader = document.createElement("div");
  appidHeader.classList.add("header");
  appidHeader.classList.add("appid");
  appidHeader.style.fontWeight = "700";
  appidHeader.style.paddingLeft = "32px";

  const nameHeader = document.createElement("div");
  nameHeader.classList.add("header");
  nameHeader.classList.add("name");
  nameHeader.style.fontWeight = "700";
  nameHeader.style.paddingLeft = "16px";

  const addedHeader = document.createElement("div");
  addedHeader.classList.add("header");
  addedHeader.classList.add("added");
  addedHeader.style.fontWeight = "700";
  addedHeader.style.paddingLeft = "16px";

  row.appendChild(iconHeader);
  row.appendChild(appidHeader);
  row.appendChild(nameHeader);
  row.appendChild(addedHeader);

  return row;
}

function buildHeaderRow(headers) {
  const columns = headers.map(({ text, cls }) => {
    const header = document.createElement("div");
    header.classList.add("header");
    header.classList.add(cls);
    header.appendChild(document.createTextNode(text));

    return header;
  });

  const row = document.createElement("div");
  row.classList.add("table-row");
  row.classList.add("header-row");

  columns.forEach((column) => row.appendChild(column));

  return row;
}

// eslint-disable-next-line no-unused-vars
function buildTable(apps) {
  if (apps.length < 1) {
    showError("This wishlist appears to be empty.");
    return;
  }

  const list = document.querySelector("#list");
  if (!list) {
    showError("Unable to build list! Please try again.");
    return;
  }

  if (!isMobile()) {
    list.appendChild(buildHeaderRow([
      { text: "Icon", cls: "icon" },
      { text: "App Id", cls: "appid" },
      { text: "App Name", cls: "name" },
      { text: "Date Added", cls: "added" },
    ]));
  }

  const rows = apps.map((app) => {
    const row = document.createElement("div");
    row.classList.add("table-row");

    const link = document.createElement("a");
    link.href = `https://store.steampowered.com/app/${app.appid}/`;
    link.appendChild(document.createTextNode(app.name));
    const name = document.createElement("div");
    name.classList.add("name");
    name.appendChild(link);

    if (!isMobile()) {
      const img = document.createElement("img");
      img.src = app.image;

      const appid = document.createElement("div");
      appid.classList.add("appid");
      appid.appendChild(document.createTextNode(app.appid));

      const added = document.createElement("div");
      added.classList.add("added");
      const date = app.added ? new Date(app.added * 1000) : null;
      added.appendChild(document.createTextNode(formatDateAdded(date)));

      row.appendChild(img);
      row.appendChild(appid);
      row.appendChild(name);
      row.appendChild(added);
    } else {
      row.appendChild(name);
    }

    return row;
  });

  rows.forEach((row) => {
    list.appendChild(row);
  });

  hideLoader();
  showListElement();
}

// eslint-disable-next-line no-unused-vars
function buildGamesListTable({
  steamid,
  nickname,
  games,
}) {
  if (!steamid) {
    showError("There was a problem getting the list.");
    return;
  }

  if (!games || games.length < 1) {
    showError("There were no games returned for this Steam Id.");
    return;
  }

  const gamesList = document.querySelector("#list");
  if (!gamesList) {
    showError("There was a problem getting the list.");
    return;
  }

  const labelSteamId = document.querySelector("#steamid");
  const labelCount = document.querySelector("#count");
  const labelNickname = document.querySelector("#nickname");

  const count = games.length || 0;

  if (!isMobile()) {
    gamesList.appendChild(buildHeaderRow([
      { text: "Icon", cls: "icon" },
      { text: "App Id", cls: "appid" },
      { text: "App Name", cls: "name" },
      { text: "Hours Played", cls: "hours-played" },
    ]));
  }

  labelCount.innerHTML = `Found ${count} games`;
  labelSteamId.innerHTML = ` for Steam Id ${steamid}`;
  labelNickname.innerHTML = `Steam user nickname ${nickname}`;

  const rows = games.map((game) => {
    const {
      appname,
      appicon,
      allhours,
      appid: id,
    } = game;

    const row = document.createElement("div");
    row.classList.add("table-row");

    const link = document.createElement("a");
    link.href = `https://store.steampowered.com/app/${id}/`;
    link.appendChild(document.createTextNode(appname));
    const name = document.createElement("div");
    name.classList.add("name");
    name.appendChild(link);

    if (!isMobile()) {
      const img = document.createElement("img");
      img.src = appicon;

      const appid = document.createElement("div");
      appid.classList.add("appid");
      appid.appendChild(document.createTextNode(id));

      const hoursPlayed = document.createElement("div");
      hoursPlayed.classList.add("hours-played");
      hoursPlayed.appendChild(document.createTextNode(`${allhours} hrs`));

      row.appendChild(img);
      row.appendChild(appid);
      row.appendChild(name);
      row.appendChild(hoursPlayed);
    } else {
      row.appendChild(name);
    }

    return row;
  });

  rows.forEach((row) => {
    gamesList.appendChild(row);
  });

  hideLoader();
  showListElement();
}
