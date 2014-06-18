(function() {

  // local vars for linting (and performance)
  var vendor = window.vendor;

  // upper bar
  var logos = document.querySelectorAll(".group-logo");
  logos = Array.prototype.slice.call(logos);
  var recentButton = document.querySelector(".group-logo[data-group=recent]");
  var searchInput = document.getElementById("search");

  // group divs
  var groups = document.querySelectorAll(".group[data-emoji=true]");
  groups = Array.prototype.slice.call(groups);
  var recentDiv = document.getElementById("recent");
  var searchContainer = document.getElementById("search-container");

  // detail area
  var detailInput = document.getElementById("detail-input");
  var detailLogo = document.getElementById("detail-logo");
  var copyButton = document.getElementById("copy-button");
  var aboutButton = document.getElementById("about-button");

  // recently used emojis
  var recent = [];

  // maximum number of recents
  var MAX_RECENT = 40;

  // maximum displayed search results for performance
  var MAX_SEARCH_RESULTS = 75;

  // very simple utility http get function
  function getJSON(url, cb) {
    var request = new XMLHttpRequest();
    request.open("GET", url, true);
    request.send();
    request.onreadystatechange = function() {
      if (request.readyState === 4) {
        cb(request.responseText);
      }
    };
  }

  // load emojis from json
  var emojis = [];
  getJSON("./emojis.json", function(res) {
    // flatten and objectify emojis
    var map = JSON.parse(res);
    Object.keys(map).forEach(function(group) {
      Object.keys(map[group]).forEach(function(k) {
        emojis.push({
          name: k,
          src: map[group][k]
        });
      });
    });
  });

  // show an emoji in the bottom detail screen
  function showDetail(name, src) {
    detailLogo.src = src;
    detailInput.value = ":" + name + ":";
  }

  function addEmojiClickListener(node) {
    node.addEventListener('click', function() {
      var item = {
        name: node.dataset.name,
        src: node.dataset.src
      };

      // save last in local storage
      vendor.setLocal('last', item);

      // set item in recent
      recent = [item].concat(recent.filter(function(el) {
        return el.name !== item.name;
      }));

      // remove last if number too high
      if (recent.length > MAX_RECENT) {
        recent.splice(MAX_RECENT, 1);
      }

      // persist recent
      vendor.setLocal('recent', recent);

      // show selected emoji in detail
      showDetail(item.name, item.src);
      vendor.copyToClipboard(detailInput);
    });
  }

  function appendItem(container, item) {
    var cont = document.createElement("div");
    cont.classList.add("emoji");
    cont.dataset.name = item.name;
    cont.dataset.src = item.src;

    var img = document.createElement("img");
    img.src = item.src;
    cont.appendChild(img);

    //var span = document.createElement("span");
    //span.innerHTML = item.name;
    //cont.appendChild(span);

    addEmojiClickListener(cont);
    container.appendChild(cont);
  }

  function updateRecent() {
    recentDiv.innerHTML = "";

    // intermediate container to render the dom as few times as possible
    var cont = document.createElement("div");
    recent.forEach(appendItem.bind(null, cont));
    recentDiv.appendChild(cont);
  }

  groups.forEach(function(group) {
    var nodes = Array.prototype.slice.call(group.childNodes);
    nodes.forEach(addEmojiClickListener);
  });

  // copybutton is not present in safari
  if (copyButton) {
    copyButton.addEventListener("click", vendor.copyToClipboard.bind(null, detailInput));
  }

  var setActiveGroup = (function() {
    // show first group
    var activeGroup = groups[0];
    activeGroup.style.display = "block";
    var activeLogo = logos[0];
    activeLogo.classList.add("selected");

    return function(logo) {
      if (activeLogo !== logo) {
        logo.classList.add("selected");
        activeLogo.classList.remove("selected");
        activeLogo = logo;
        var newActive = document.getElementById(logo.dataset.group);
        activeGroup.style.display = "none";
        newActive.style.display = "block";
        activeGroup = newActive;
      }
    };
  }());

  aboutButton.addEventListener('click', function() {
    setActiveGroup(aboutButton);
  });

  recentButton.addEventListener('click', updateRecent);

  // add click listener to logo that changes the displayed group
  logos.forEach(function(logo) {
    logo.addEventListener('click', setActiveGroup.bind(null, logo));
  });

  // search functionality
  (function() {
    var lastVal;
    searchInput.addEventListener("keyup", function() {
      setActiveGroup(searchInput);
      var val = searchInput.value;
      // prevent flickering
      setTimeout(function() {
        if (searchInput.value === val && val !== lastVal) {
          lastVal = val;
          searchContainer.innerHTML = "";

          // intermediate container to render the dom as few times as possible
          var cont = document.createElement("div");
          var filtered = emojis.filter(function(emoji) {
            return emoji.name.indexOf(val) !== -1;
          });
          filtered = filtered.slice(0, MAX_SEARCH_RESULTS);
          filtered.forEach(appendItem.bind(null, searchContainer));
          recentDiv.appendChild(cont);
        }
      }, 200);
    });
  }());

  // wait for plugin to be fully loaded before querying data
  window.addEventListener("load", function() {
    // get last used emoji from user locals and display
    vendor.getLocal("last", function(item) {
      if (item) {
        showDetail(item.name, item.src);
      }
    });

    // get recents from user locals
    vendor.getLocal("recent", function(rec) {
      recent = rec || recent;
      updateRecent();
    });

  }, false);

}());
