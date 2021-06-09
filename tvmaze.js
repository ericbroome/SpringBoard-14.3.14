/*
  Use an object to represent invalid request such that something is always displayed even if there was an error
*/
const invalid = {
    id: -1,
    showId: -1,
    name: "invalid episode",
    season: 0,
    number: 0,
    summary: "You may have entered an invalid search term and/or no results were found",
    image: "https://tinyurl.com/tv-missing"
}

/**
 * Drill down to get an image url or return a default one
 */
const extractImageURL = function(item, defaultImage = invalid.image) {
  let img = !item.image ? defaultImage :
  item.image.medium ? 
    item.image.medium : item.image.original ? 
      item.image.original : defaultImage;
  return img;
}

/** Search Shows
 *    - given a search term, search for tv shows that
 *      match that query.  The function is async show it
 *       will be returning a promise.
 *
 *   - Returns an array of objects. Each object should include
 *     following show information:
 *    {
        id: <show id>,
        name: <show name>,
        summary: <show summary>,
        image: <an image from the show data, or a default imege if no image exists, (image isn't needed until later)>
      }
 */
async function searchShows(query) {
  let response = null;
  let results = [];
  try {
    response = await axios.get(`https://api.tvmaze.com/search/shows?q=${query}`);
    response = response.data;
  } catch(error) {
    response = [invalid];
  }
  if(!response || response.length == 0)response = [invalid];
  $(response).each((index, item) => {
    if(item.show)item=item.show;  //Make it so that we don't have to use .show which makes it easier to share invalid object with episodes handlers
    results.push(
      {
        id: item.id,
        name: item.name,
        summary: item.summary,
        image: extractImageURL(item)
      });
  });
  return results;
}



/** Populate shows list:
 *     - given iterable collection of shows, add shows to DOM
 */

function populateShows(shows) {
  const $showsList = $("#shows-list");
  $showsList.empty();

  for (let show of shows) {
    let $item = $(
      `<div class="col-md-6 col-lg-3 Show" data-show-id="${show.id}">
        <div class="card" data-show-id="${show.id}">
          <img src="${show.image}" class="card-img-top" alt="...">
          <div class="card-body">
            <h5 class="card-title">${show.name}</h5>
            <div class="card-text limit-text">
              ${show.summary}
            </div>
            <a id="show_${show.id}" class="btn btn-primary text-white" href="">Episodes</a>
          </div>
        </div>
      </div>
      `);
    $showsList.append($item);
    $(`#show_${show.id}`).click(onEpisodes); //Here we set a handler which I would much rather set inline right here but ...
  }
}

/*
  Create an unordered list of episodes and add it to the episodes area
*/
const populateEpisodes = function(episodes) {
  $("#episodes-list").empty();
// Now let's fill the UL with LI entries, one for each episode
  for (let episode of episodes) {
    let $item = $(`<li id="episode_${episode.id}">${episode.name} (season ${episode.season}, number ${episode.number}</li>`);
// We can use this data when creating a modal or whatever
    $("#episodes-list").append($item);
  }
}

  /* Even though it is easier and more obvious an answer to just add an id to each button we'll get it from some container up the line
    We'll also get the array of episode objects too, in one line.
  */
async function onEpisodes(event) {
  event.preventDefault();
  let showId = $(event.target).closest("[data-show-id]").attr("data-show-id");
  let episodes = await getEpisodes(+showId);
  populateEpisodes(episodes);
  $("#episodes-area").show();
}

/** Handle search form submission:
 *    - hide episodes area
 *    - get list of matching shows and show in shows list
 */

$("#search-form").on("submit", async function handleSearch (evt) {
  evt.preventDefault();
  let query = $("#search-query").val();
  if (!query) return;
  $("#episodes-area").hide();
  let shows = await searchShows(query);
  populateShows(shows);
});


/** Given a show ID, return list of episodes:
 *      { id, name, season, number }
 */

async function getEpisodes(id) {
  let response = null;
  let results = [];
  try {
    response = await axios.get(`https://api.tvmaze.com/shows/${id}/episodes`)
    response = response.data;
  } catch(error) {
    response = [invalid];
  }
  $(response).each((index, item) => {
    results.push(
      {
        id: item.id,
        show: id,
        name: item.name,
        season: item.season,
        number: item.number,
        summary: item.summary,
        image: extractImageURL(item)
      });
  });
  return results;
}
