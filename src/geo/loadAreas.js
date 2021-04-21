const fetch = require('node-fetch')
const osm2geojson = require('osm2geojson-lite')
const simplify = require('simplify-geojson')

// https://nominatim.openstreetmap.org/search.php?city=Bonn&state=NRW&country=Germany&postalcode=53115&polygon_geojson=1&format=jsonv2

function loadPostalcodeArea (postalcode) {
//     const url = `https://overpass-api.de/api/interpreter?data=
// [out:json][timeout:2400][bbox:57.77505,-3.96411,44.78204,19.84477];
// relation[type=boundary][boundary=postal_code][postal_code=${postalcode}];
// (._;>;);
// out qt;
//   `
  const url = `https://overpass-api.de/api/interpreter?data=
[out:json][timeout:2400][bbox:90,-180,-90,180];
relation[type=boundary][boundary=postal_code][postal_code=${postalcode}];
(._;>;);
out qt;
  `

  // On OpenStreetMap, postal_code is nearly only used in Germany.

  return fetch(encodeURI(url), {
    method: 'get',
    headers: {
      'Content-Type': 'application/json',
      Referer: 'anyway-koeln.de',
      'User-Agent': 'anyway-koeln.de'
    }
  })
    .then(res => res.json())
    .then(data => {
      let meta = data.elements.filter(element => element.type === 'relation')

      if (meta.length > 0) {
        meta = meta[0]
        delete meta.members

        let geojson = osm2geojson(data)
        geojson = simplify(geojson, 0.05)

        geojson.properties = meta
        return geojson
      }

      return null
    })
    .catch(error => {
      console.error(error)
      return null
    })
}

loadPostalcodeArea('53115')
  .then(geojson => console.log(JSON.stringify(geojson).length))

/*
const fetch = require('node-fetch')
const osm2geojson = require('osm2geojson-lite')

// https://nominatim.openstreetmap.org/search.php?city=Bonn&state=NRW&country=Germany&postalcode=53115&polygon_geojson=1&format=jsonv2

function loadPostalcodeArea (postalcode) {
  const url = `https://overpass-api.de/api/interpreter?data=
[out:json][timeout:2400][bbox:57.77505,-3.96411,44.78204,19.84477];
relation["type"="boundary"]["boundary"="postal_code"]["postal_code"="${postalcode}"];
(._;>;);
out qt;
  `

  return fetch(encodeURI(url), {
    method: 'get',
    headers: {
      'Content-Type': 'application/json',
      Referer: 'anyway-koeln.de',
      'User-Agent': 'anyway-koeln.de'
    }
  })
    .then(res => res.json())
    .then(data => {
      let meta = data.elements.filter(element => element.type === 'relation')

      if (meta.length > 0) {
        meta = meta[0]
        delete meta.members

        let geojson = osm2geojson(data)
        geojson.properties = meta
        return geojson
      }

      return null
    })
    .catch(error => {
      console.error(error)
      return null
    })
}

loadPostalcodeArea(53115)
  .then(console.log)

  */

/*
const opencage = require('opencage-api-client')

const apiKey = ''

opencage
  .geocode({
      endpoint: 'https://api.opencagedata.com/geocode/v1/json',
      q: '53115, Bonn, Germany',
      limit: 1,
      language: 'native',
      no_annotations: 1,
      key: apiKey
    })
    .then((data) => {
      if (data.status.code === 200 && data.results.length > 0) {
          return data.results[0]
      }
      return null
  })
  .then(data => {
      console.log(JSON.stringify(data, null, 2))
      return data
  })
  .catch((error) => {
      console.log('Error caught:', error.message)
  })
*/
