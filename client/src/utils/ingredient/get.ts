import axios from 'axios'

const getIngredient = async () => {
  try {
    const response = await axios.get('/api/data')
    console.log('Received data:', response.data)
    return response.data
  } catch (error) {
    console.error('Error fetching data:', error)
    return []
  }
}

export { getIngredient }
