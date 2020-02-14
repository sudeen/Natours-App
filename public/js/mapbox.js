export const displayMap = locations => {
  mapboxgl.accessToken =
    'pk.eyJ1Ijoic3VkZWVuIiwiYSI6ImNrNm04ZGNjeTBuNjczanBjNXV6MzExOHIifQ.e5LHDDS1Hzso3Lis8OxBKQ';
  var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/sudeen/ck6m8kviv07m81ip2dpsxw9or',
    scrollZoom: false
    //   center: [-118.113491, 34.111745], // First longitude and then lattitude
    //   zoom: 4,
    //   interactive: false
  });

  const bounds = new mapboxgl.LngLatBounds();

  locations.forEach(loc => {
    // Create marker
    const el = document.createElement('div');
    el.className = 'marker';

    // Add marker
    new mapboxgl.Marker({
      element: el,
      anchor: 'bottom'
    })
      .setLngLat(loc.coordinates)
      .addTo(map);

    // Add popup
    new mapboxgl.Popup({
      offset: 30
    })
      .setLngLat(loc.coordinates)
      .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
      .addTo(map);

    // Extend the map bounds to include the current location
    bounds.extend(loc.coordinates);
  });

  map.fitBounds(bounds, {
    padding: {
      top: 200,
      bottom: 150,
      left: 100,
      right: 100
    }
  });
};
