// eslint-disable-next-line no-unused-vars
function getFullListClick() {
  const steamid = document.querySelector("#steamid").value;
  if (!steamid || steamid === "") {
    return;
  }
  document.location.href = `/list?steamid=${steamid}`;
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
  console.log(message);
  const error = document.querySelector("#error");
  error.innerHTML = message;
  hideElement("#error", false);
}

function showTable() {
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

// eslint-disable-next-line no-unused-vars
function getQsParam(param, url = window.location.href) {
  const paramName = param.replace(/[\[\]]/g, "\\$&");
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
function updateTotalCount(count) {
  const totalCount = document.querySelector("#count");
  if (totalCount) {
    totalCount.innerHTML = `Found ${count} apps for`;
  }
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

  const rows = apps.map((app) => {
    const row = document.createElement("div");
    row.classList.add("table-row");

    const img = document.createElement("img");
    img.src = app.image;

    const appid = document.createElement("div");
    appid.classList.add("appid");
    appid.appendChild(document.createTextNode(app.appid));

    const link = document.createElement("a");
    link.href = `https://store.steampowered.com/app/${app.appid}/`;
    link.appendChild(document.createTextNode(app.name));
    const name = document.createElement("div");
    name.classList.add("name");
    name.appendChild(link);

    const added = document.createElement("div");
    added.classList.add("added");
    const date = app.added ? new Date(app.added * 1000) : null;
    added.appendChild(document.createTextNode(formatDateAdded(date)));

    row.appendChild(img);
    row.appendChild(appid);
    row.appendChild(name);
    row.appendChild(added);

    return row;
  });

  rows.forEach((row) => {
    list.appendChild(row);
  });

  hideLoader();
  showTable();
}
