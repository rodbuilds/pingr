// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBi-Lt0QghwG-mki747QXZwD8EzGjOdSzk",
  authDomain: "pingr-267f4.firebaseapp.com",
  projectId: "pingr-267f4",
  storageBucket: "pingr-267f4.appspot.com",
  databaseURL: "https://pingr-267f4-default-rtdb.firebaseio.com",
  messagingSenderId: "722347500195",
  appId: "1:722347500195:web:24f24f0a6703d443ff5516",
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const DB = firebase.database();

const M3O_KEY = "NGM2MzI3ODAtYmY2YS00NGY3LTgwNjUtM2YzMzk4MDAxMDU4";
let loading = false;
let favLoading = false;

$(window).load(function () {
  loadFavs();

  $("#host-input").keypress(function (event) {
    // Method found on https://howtodoinjava.com/jquery/jquery-detect-if-enter-key-is-pressed/
    let keycode = event.keyCode ? event.keyCode : event.which;
    if (keycode == "13") {
      onPing();
    }
  });
});

async function onPing() {
  const host = $("#host-input").val();
  if (host) {
    $("#host-input").val("");
    toggleLoad();
    $("#ping-results").text(`${host} is ${(await ping(host)) ? "up" : "down"}`);
    toggleLoad();
  }
}

function ping(host) {
  const data = { address: host };

  return fetch("https://api.m3o.com/v1/ping/Ip", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${M3O_KEY}`,
    },
    body: JSON.stringify(data),
  })
    .then((response) => response.json())
    .then((data) => {
      //   console.log("Success:", data);
      if (data.status === "OK") {
        return true;
      } else {
        return false;
      }
    })
    .catch((error) => {
      console.error("Error:", error);
    });
}

async function onFav() {
  const host = $("#host-input").val();
  $("#host-input").val("");
  const hostsRef = DB.ref("hosts");
  toggleLoad();
  const status = await ping(host);
  toggleLoad();
  const uid = hostsRef.push({ host: host, status: status });
  const data = { uid: uid.key, host: host, status: status };
  appendFav(data);
  //   loadFavs();
}

function deleteFav(id) {
  const hostsRef = DB.ref(`hosts/${id}`);
  hostsRef.remove();
  $(`#${id}`).remove();
}

function toggleLoad() {
  if (!loading) {
    $("#main-loader").removeClass("visually-hidden");
    loading = true;
  } else {
    $("#main-loader").addClass("visually-hidden");
    loading = false;
  }
}

function toggleFavLoad() {
  if (!loading) {
    $("#fav-loader").removeClass("visually-hidden");
    loading = true;
  } else {
    $("#fav-loader").addClass("visually-hidden");
    loading = false;
  }
}

async function loadFavs() {
  $("#fav-list").empty();
  const dbRef = DB.ref("hosts");
  dbRef
    .once("value")
    .then((snapshot) => {
      const collection = snapshot.val();
      displayFavs(collection);
    })
    .catch((error) => {
      console.error(error);
    });
}

function displayFavs(data) {
  for (let doc in data) {
    appendFav({
      uid: doc,
      host: data[doc].host,
      status: data[doc].status,
    });
  }
}

// appendFav({
//     uid: host.key,
//     host: host.val().host,
//     status: host.val().status,
//   });

function appendFav(data) {
  const source = $("#fav-template").html();
  const template = Handlebars.compile(source);
  //   const data = { uid: uid.key, host: host, status: status };
  console.log(data);
  const compiledTemplate = template(data);
  $("#fav-list").append(compiledTemplate);
}

async function pingFavs() {
  toggleFavLoad();
  await updateFavs();
  loadFavs();
  toggleFavLoad();
}

async function updateFavs() {
  let updates = [];
  const dbRef = DB.ref("hosts");
  dbRef
    .once("value")
    .then((snapshot) => {
      const collection = snapshot.val();
      updateHosts(collection);
    })
    .catch((error) => {
      console.error(error);
    });
}

async function updateHosts(data) {
  $("#fav-list").empty();
  toggleFavLoad();
  let updates = [];
  for (let doc in data) {
    updates.push({ id: doc, host: data[doc].host });
  }
  console.log(updates);
  for (let update of updates) {
    const hostsIdRef = DB.ref("hosts").child(update.id);
    const status = await ping(update.host);
    hostsIdRef.update({ status: status });
  }
  toggleFavLoad();
  loadFavs();
}
