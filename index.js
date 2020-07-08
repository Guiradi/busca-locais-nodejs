/* eslint-disable no-console */
/* eslint-disable camelcase */
const fs = require('fs')
const axios = require('axios')
const config = require('./config')

async function fetchPlaces(type) {
  try {
    const url = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json'

    const params = {
      key: config.GOOGLE_PLACES_API_KEY,
      location: config.location,
      radius: config.radius,
      type,
    }

    const { data } = await axios({
      url,
      method: 'get',
      params,
    })

    const placesIds = data.results.map(({ place_id }) => place_id)

    return placesIds
  } catch (error) {
    console.error(error)
    throw error
  }
}

async function fetchPlacesDetails(placesIds, type) {
  try {
    let csv = 'Bairro,Nome do estabelecimento,Telefone,WebSite,Setor,Endereço'
    const filePath = `Planilhas/${type}.csv`

    const url = 'https://maps.googleapis.com/maps/api/place/details/json'
    const key = config.GOOGLE_PLACES_API_KEY
    let i = 0

    // eslint-disable-next-line no-restricted-syntax
    for await (const place_id of placesIds) {
      // eslint-disable-next-line no-plusplus
      console.log(`Buscando ${type}... ${++i}/${placesIds.length} já buscados`)

      const { data } = await axios({
        url,
        method: 'get',
        params: {
          place_id,
          key,
          fields:
            'address_components,name,formatted_phone_number,website,formatted_address',
        },
      })

      const bairroObj = data.result.address_components.find((x) =>
        x.types.includes('sublocality')
      )
      const bairro = bairroObj ? bairroObj.long_name : '-'
      const nome_estabelecimento = data.result.name || '-'
      const telefone = data.result.formatted_phone_number || '-'
      const website = data.result.website || '-'
      const setor = type
      const endereco = data.result.formatted_address || '-'

      csv += `\n${bairro},${nome_estabelecimento},${telefone},${website},${setor},"${endereco}"`
    }

    // eslint-disable-next-line consistent-return
    fs.writeFile(filePath, csv, (err) => {
      if (err) return console.error(err)
      console.log(`${type} salvo em ${filePath}`)
    })
  } catch (error) {
    console.error(error)
    throw error
  }
}

async function fetchAndSaveCSV(type, Tipo) {
  // eslint-disable-next-line no-useless-catch
  try {
    const placesIds = await fetchPlaces(type)
    await fetchPlacesDetails(placesIds, Tipo)
  } catch (error) {
    throw error
  }
}

fetchAndSaveCSV('restaurant', 'Restaurante')
fetchAndSaveCSV('cafe', 'Café')
fetchAndSaveCSV('convenience_store', 'Conveniência')
fetchAndSaveCSV('gas_station', 'Posto de Gasolina')
fetchAndSaveCSV('liquor_store', 'Loja de Bebidas')
fetchAndSaveCSV('supermarket', 'Mercado')
