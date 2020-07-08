/* eslint-disable camelcase */
/* eslint-disable no-console */
import fs from 'fs'
import axios from 'axios'
import config from './config'

export class GooglePlaces {
  fetchPlaces = async (type) => {
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

  fetchPlacesDetails = async (placesIds, type) => {
    try {
      let csv = 'Bairro,Nome do estabelecimento,Telefone,WebSite,Setor,Endereço'
      const filePath = `Planilhas/${type}.csv`

      const url = 'https://maps.googleapis.com/maps/api/place/details/json'
      const key = config.GOOGLE_PLACES_API_KEY

      // eslint-disable-next-line no-restricted-syntax
      for await (const place_id of placesIds) {
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

  fetchAndSaveCSV = async (type, Tipo) => {
    const placesIds = await this.fetchPlaces(type)
    await this.fetchPlacesDetails(placesIds, Tipo)
  }
}
