// TMDb API Key and base URL
const API_KEY = '9055277226d1096ec26ed7a3ec918956';
const BASE_URL = 'https://api.themoviedb.org/3';

// Elements
const searchInput = document.querySelector('.search-bar input');
const searchButton = document.querySelector('.search-bar button');
const resultsContainer = document.getElementById('results');
const mainContainer = document.querySelector('.main-container')

let movies = []; // Define globally to use in event listeners

// Load previous search results if on search page
if (document.body.id === "search-page") {
    const savedResults = JSON.parse(localStorage.getItem("movieResults"));
    if (savedResults) {
        movies = savedResults; // Assign to global movies array
        renderMovies(savedResults);
    }
}

// Fetch movie details for runtime and genres
async function fetchMovieDetails(id) {
    const url = `${BASE_URL}/movie/${id}?api_key=${API_KEY}&language=en-US`;
    const response = await fetch(url);
    return response.json();
}

// Fetch up to 20 movie results from TMDb and get details
async function fetchMovies(query) {
    const url = `${BASE_URL}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(query)}&language=en-US`;
    try {
        const response = await fetch(url);
        const data = await response.json();

        // Fetch details for each movie
        const moviesWithDetails = await Promise.all(
            data.results.slice(0, 20).map(async (movie) => {
                const details = await fetchMovieDetails(movie.id);
                return { ...movie, ...details }; // Combine search and detail data
            })
        );
        return moviesWithDetails;
    } catch (error) {
        console.error('Error fetching movies:', error);
        return [];
    }
}

// Render movies in the results container
function renderMovies(moviesToRender) {
    const exploreIcon = document.querySelector('.main-container img');
    if (exploreIcon) exploreIcon.style.display = 'none';
    resultsContainer.innerHTML = ''; // Clear previous results

    if (moviesToRender.length === 0) {
        mainContainer.innerHTML = `<p>${document.body.id === "watchlist-page" ? "Your watchlist is looking a little empty..." : "No movies found"}</p>`;
        return;
    }

    moviesToRender.forEach((movie) => {
        const movieCard = document.createElement('div');
        movieCard.classList.add('movie-card');
        movieCard.innerHTML = `
            <img class="poster-img" src="${movie.poster_path ? `https://image.tmdb.org/t/p/w200${movie.poster_path}` : '/default-poster.jpg'}" alt="${movie.title}">
            <div class="movie-info">
                <div class="title-section">
                    <h3>${movie.title}</h3>
                    <img src="/star-symbol-icon.svg" alt="star" class="star-icon">
                    <span class="rating">${movie.vote_average || 'N/A'}</span>
                </div>
                <div class="details-section">
                    <span class="runtime">${movie.runtime || 'N/A'} min</span>
                    <span class="genre">${movie.genres?.slice(0, 3).map(g => g.name).join(', ') || 'N/A'}</span>
                    <button class="watchlist-btn" data-id="${movie.id}">
                        <img src="${document.body.id === "watchlist-page" ? "/remove-btn.png" : "/add-btn.png"}" alt="${document.body.id === "watchlist-page" ? "minus" : "plus"}">
                        ${document.body.id === "watchlist-page" ? "Remove" : "Watchlist"}
                    </button>
                </div>
                <p class="overview">${movie.overview.split(' ').slice(0, 20).join(' ')}...</p>
            </div>
        `;
        resultsContainer.appendChild(movieCard);
    });
}

// Add to Watchlist or Remove from Watchlist
resultsContainer.addEventListener('click', (e) => {
    if (e.target.classList.contains('watchlist-btn')) {
        const movieId = e.target.dataset.id;
        let watchlist = JSON.parse(localStorage.getItem('watchlist')) || [];

        if (document.body.id === "search-page") {
            // Add to watchlist
            const movie = movies.find(m => m.id == movieId);
            if (!watchlist.some(m => m.id == movieId)) {
                watchlist.push(movie);
                localStorage.setItem('watchlist', JSON.stringify(watchlist));
            }
        } else if (document.body.id === "watchlist-page") {
            // Remove from watchlist
            watchlist = watchlist.filter(m => m.id != movieId);
            localStorage.setItem('watchlist', JSON.stringify(watchlist));
            renderWatchlist(); // Re-render after removal
        }
    }
});

// Event listener for search
if (document.body.id === "search-page") {
    searchButton.addEventListener('click', async () => {
        const query = searchInput.value.trim();
        if (query) {
            movies = await fetchMovies(query); // Assign fetched movies to global movies array
            localStorage.setItem("movieResults", JSON.stringify(movies));
            renderMovies(movies);
        } else {
            renderMovies([]); // Show "No movies found" message if query is empty
        }
    });
}

// Render Watchlist with updated button for removal
function renderWatchlist() {
    const watchlist = JSON.parse(localStorage.getItem('watchlist')) || [];
    renderMovies(watchlist);
}

// Check if on watchlist page and render watchlist
if (document.body.id === "watchlist-page") {
    document.addEventListener('DOMContentLoaded', renderWatchlist);
}
