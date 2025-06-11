document.addEventListener('DOMContentLoaded', () => {
    // Replace with your Mapbox access token
    mapboxgl.accessToken = 'TOKEN'

    const guessInput = document.getElementById('guess-input');
    const submitBtn = document.getElementById('submit-btn');
    const nextBtn = document.getElementById('next-btn');
    const resultDiv = document.getElementById('result');
    const scoreDiv = document.getElementById('score');

    let currentCountry;
    let score = 0;
    let map;

    // Initialize the map
    function initMap() {
        map = new mapboxgl.Map({
            container: 'map',
            style: 'mapbox://styles/mapbox/light-v11',
            center: [0, 20],
            zoom: 1.5
        });

        // Remove country labels when map loads
        map.on('styledata', () => {
            hideMapLabels();
        });

        map.on('load', () => {
            // Add sources and layers once the map is loaded
            map.addSource('country-source', {
                type: 'geojson',
                data: {
                    type: 'FeatureCollection',
                    features: []
                }
            });

            map.addLayer({
                id: 'country-fill',
                type: 'fill',
                source: 'country-source',
                paint: {
                    'fill-color': '#3498db',
                    'fill-opacity': 0.8
                }
            });

            map.addLayer({
                id: 'country-border',
                type: 'line',
                source: 'country-source',
                paint: {
                    'line-color': '#e74c3c',
                    'line-width': 3,
                    'line-opacity': 1
                }
            });

            // Start the game
            displayRandomCountry();
        });
    }

    // Display a random country
    function displayRandomCountry() {
        // Clear previous result and input
        resultDiv.textContent = '';
        guessInput.value = '';
        guessInput.disabled = false;
        submitBtn.disabled = false;

        // Select a random country
        const randomIndex = Math.floor(Math.random() * countriesData.length);
        currentCountry = countriesData[randomIndex];

        // Fetch the country shape from Mapbox
        fetchCountryShape(currentCountry.code);
    }

    // Fetch country shape using Natural Earth data via public GeoJSON
    async function fetchCountryShape() {
        try {
            // Fit map to country bounds
            map.fitBounds(currentCountry.bounds, {
                padding: 50,
                duration: 1000
            });

            // Use a public GeoJSON source for country data
            const url = `https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson`;

            const response = await fetch(url);
            const data = await response.json();

            // Find the country by ISO code
            const countryFeature = data.features.find(feature =>
                feature.properties.ISO_A2 === currentCountry.code
            );

            if (countryFeature) {
                // Update the map source with the country shape
                map.getSource('country-source').setData({
                    type: 'FeatureCollection',
                    features: [countryFeature]
                });
            } else {
                console.error('Country shape not found');
                // Try another country
                displayRandomCountry();
            }
        } catch (error) {
            console.error('Error fetching country shape:', error);
        }
    }

    // Check the user's guess
    function checkGuess() {
        const userGuess = guessInput.value.trim().toLowerCase();
        const correctAnswer = currentCountry.name.toLowerCase();

        if (userGuess === correctAnswer) {
            resultDiv.textContent = 'Correct! Well done!';
            resultDiv.style.color = 'green';
            score++;
            scoreDiv.textContent = `Score: ${score}`;

            // Change the country fill color to green
            map.setPaintProperty('country-fill', 'fill-color', '#2ecc71');
        } else {
            resultDiv.textContent = `Wrong! The correct answer is ${currentCountry.name}.`;
            resultDiv.style.color = 'red';

            // Change the country fill color to red
            map.setPaintProperty('country-fill', 'fill-color', '#e74c3c');
        }

        guessInput.disabled = true;
        submitBtn.disabled = true;
    }

    // Event listeners
    submitBtn.addEventListener('click', checkGuess);
    guessInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            checkGuess();
        }
    });
    nextBtn.addEventListener('click', displayRandomCountry);

    // Function to hide all map labels
    function hideMapLabels() {
        const layers = map.getStyle().layers;

        // Hide all text labels by setting visibility to 'none'
        for (const layer of layers) {
            if (layer.type === 'symbol' && layer.layout && layer.layout['text-field']) {
                map.setLayoutProperty(layer.id, 'visibility', 'none');
            }
        }
    }

    // Initialize the map
    initMap();
});