/* eslint-disable class-methods-use-this */
/* eslint-disable camelcase */
/* eslint-disable no-console */
const fs = require('fs')
const axios = require('axios')
const { promisify } = require('util')
// const { uniq } = require('lodash')
const config = require('./config')
const TypeList = require('./utils/TypeEnum')

const readFileAsync = promisify(fs.readFile)
const writeFileAsync = promisify(fs.writeFile)

// fs.readFile('credentials.json', (err, content) => {
//   if (err) return console.log('Error loading client secret file:', err)
//   // Authorize a client with credentials, then call the Google Calendar API.
//   authorize(JSON.parse(content), listEvents)
// })

function sleep(milliseconds) {
  const date = Date.now()
  let currentDate = null
  do {
    currentDate = Date.now()
  } while (currentDate - date < milliseconds)
}

module.exports = class GooglePlaces {
  async fetch20Places(type, pagetoken = null) {
    try {
      const url = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json'

      const params = {
        key: config.GOOGLE_PLACES_API_KEY,
        location: config.location,
        radius: config.radius,
        type,
        pagetoken,
      }

      const {
        data: { results = [], next_page_token = null },
      } = await axios({
        url,
        method: 'get',
        params,
      })

      const placesIds = results.map(({ place_id }) => place_id)

      return { placesIds, next_page_token }
    } catch (error) {
      console.error('fetch20Places', error)
      throw error
    }
  }

  async fetch60Places(type) {
    try {
      const { placesIds, next_page_token } = await this.fetch20Places(type)

      if (!next_page_token) {
        return placesIds
      }

      sleep(3000)

      const {
        placesIds: secondFetchPlacesIds,
        next_page_token: second_next_page_token,
      } = await this.fetch20Places(type, next_page_token)

      placesIds.push(...secondFetchPlacesIds)

      if (!second_next_page_token) {
        return placesIds
      }

      sleep(3000)

      const { placesIds: thirdFetchPlacesIds } = await this.fetch20Places(
        type,
        second_next_page_token
      )

      placesIds.push(...thirdFetchPlacesIds)

      return placesIds
    } catch (error) {
      console.error('fetch60Places', error)
      throw error
    }
  }

  async fetchPlaceDetails(place_id, type) {
    try {
      const { data } = await axios({
        url: 'https://maps.googleapis.com/maps/api/place/details/json',
        method: 'get',
        params: {
          place_id,
          key: config.GOOGLE_PLACES_API_KEY,
          fields:
            'address_components,name,formatted_phone_number,website,formatted_address',
        },
      })

      const bairroObj = data.result.address_components.find((x) =>
        x.types.includes('sublocality')
      )

      return {
        bairro: bairroObj ? bairroObj.long_name : '-',
        nomeEstabelecimento: data.result.name || '-',
        telefone: data.result.formatted_phone_number || '-',
        website: data.result.website || '-',
        setor: TypeList[type],
        endereco: data.result.formatted_address || '-',
      }
    } catch (error) {
      console.error('fetchPlaceDetails', error)
      throw error
    }
  }

  async createDatabase(type) {
    const idsDatabasePath = `./Database/indexes/${type}.json`
    const placesDatabasePath = `./Database/data/${type}.json`
    let idsDatabaseJSON = JSON.stringify([])

    try {
      idsDatabaseJSON = await readFileAsync(idsDatabasePath)
    } catch (error) {
      await writeFileAsync(idsDatabasePath, idsDatabaseJSON)
    }

    console.log(`Buscando ids de ${TypeList[type]}...`)
    const placesIds = await this.fetch60Places(type)
    const idsDatabase = JSON.parse(idsDatabaseJSON)

    const notInsertedIds = placesIds.filter((x) => !idsDatabase.includes(x))
    const newIdsDatabase = [...idsDatabase, ...notInsertedIds]
    await writeFileAsync(idsDatabasePath, JSON.stringify(newIdsDatabase))

    const newPlacesDetails = []

    console.log(`Buscando informações sobre ${TypeList[type]} encontrados...`)
    // eslint-disable-next-line no-restricted-syntax
    for await (const place_id of notInsertedIds) {
      const placeDetail = await this.fetchPlaceDetails(place_id, type)
      newPlacesDetails.push(placeDetail)
    }

    console.log(`Salvando nova base de dados...`)

    try {
      const placesDatabaseJSON = await readFileAsync(placesDatabasePath)
      const placesDatabase = JSON.parse(placesDatabaseJSON)
      const newPlacesDatabase = [...placesDatabase, ...newPlacesDetails]
      await writeFileAsync(
        placesDatabasePath,
        JSON.stringify(newPlacesDatabase)
      )
    } catch (error) {
      await writeFileAsync(placesDatabasePath, JSON.stringify(newPlacesDetails))
    }

    console.log('Fim')
  }

  // fetchPlacesDetails = async (placesIds, type) => {
  //   try {
  //     let csv = 'Bairro,Nome do estabelecimento,Telefone,WebSite,Setor,Endereço'
  //     const filePath = `Planilhas/${type}.csv`

  //     const url = 'https://maps.googleapis.com/maps/api/place/details/json'
  //     const key = config.GOOGLE_PLACES_API_KEY

  //     // eslint-disable-next-line no-restricted-syntax
  //     for await (const place_id of placesIds) {
  // const { data } = await axios({
  //   url,
  //   method: 'get',
  //   params: {
  //     place_id,
  //     key,
  //     fields:
  //       'address_components,name,formatted_phone_number,website,formatted_address',
  //   },
  // })

  // const bairroObj = data.result.address_components.find((x) =>
  //   x.types.includes('sublocality')
  // )
  // const bairro = bairroObj ? bairroObj.long_name : '-'
  // const nome_estabelecimento = data.result.name || '-'
  // const telefone = data.result.formatted_phone_number || '-'
  // const website = data.result.website || '-'
  // const setor = type
  // const endereco = data.result.formatted_address || '-'

  // csv += `\n${bairro},${nome_estabelecimento},${telefone},${website},${setor},"${endereco}"`
  //     }

  //     // eslint-disable-next-line consistent-return
  //     fs.writeFile(filePath, csv, (err) => {
  //       if (err) return console.error(err)
  //       console.log(`${type} salvo em ${filePath}`)
  //     })
  //   } catch (error) {
  //     console.error(error)
  //     throw error
  //   }
  // }

  // fetchAndSaveCSV = async (type, Tipo) => {
  //   const placesIds = await this.fetchPlaces(type)
  //   await this.fetchPlacesDetails(placesIds, Tipo)
  // }
}
