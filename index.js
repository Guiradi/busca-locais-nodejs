/* eslint-disable no-console */
/* eslint-disable camelcase */
const GooglePlaces = require('./GooglePlaces')
const TypeList = require('./utils/TypeEnum')

const G = new GooglePlaces()
G.createDatabase(Object.keys(TypeList)[0])
