/* eslint-disable no-console */
/* eslint-disable camelcase */
const GooglePlaces = require('./GooglePlaces')
const TypeList = require('./utils/TypeEnum')

const G = new GooglePlaces()

// Escolhe 1 método específico
// G.fetchType(Object.keys(TypeList)[0])
// G.fetchType('supermarket')

// Busca todos os métodos em uma única planilha
// G.fetchAllPlacesType()

// Busca todos os métodos em planilhas diferentes, simultâneamente
// Object.keys(TypeList).forEach((type) => G.fetchType(type))
