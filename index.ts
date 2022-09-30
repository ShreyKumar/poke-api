const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const { MongoClient } = require('mongodb')
require('dotenv').config()

import {Request, Response} from 'express'
const app = express()
app.use(cors())

const jsonParser = bodyParser.json()
const MONGO_CONNECTION_URI = process.env.MONGO_CONNECTION_URL

interface Pokemon {
  image_url: string,
  types: string[],
  name: string
}

const mongoClient = new MongoClient(MONGO_CONNECTION_URI)

const connectDb = async () => {
  try {
    await mongoClient.connect()
    await mongoClient.db('admin').command({ ping: 2 })

    console.log('Successfully established connection')
    return mongoClient.db('test')
  } catch (error) {
    throw new Error(`Error connecting to Mongo: ${error}`)
  }
}

const disconnectDb = async () => {
  await mongoClient.close()
  console.log('Successfully disconnected')
}

app.get('/', (req: Request, res: Response) => {
  res.json('OK').status(200)
})

app.post('/pokemon/sync', jsonParser, async (req: Request, res: Response) => {
  const { allPokemon }: { allPokemon: Pokemon[] } = req.body
  
  const db = await connectDb()
  const mongoResponse = await db.collection('pokemon').insertMany(allPokemon)
  res.json(mongoResponse).status(200)
})

app.get('/pokemon', async (req: Request, res: Response) => {
  const db = await connectDb()

  const allPokemon = await db.collection('pokemon').find().toArray()

  await disconnectDb()

  res.json(allPokemon).status(200)
})

app.post('/pokemon', jsonParser, async (req: Request, res: Response) => {
  const { pokemon }: { pokemon: Pokemon } = req.body

  const db = await connectDb()
  const mongoResponse = await db.collection('pokemon').insertOne(pokemon)
  await disconnectDb()

  res.json(mongoResponse).status(200)
})

app.delete('/pokemon/:name', jsonParser, async (req: Request, res: Response) => {
  const { name } = req.params
  const db = await connectDb()
  const mongoResponse = await db.collection('pokemon').findOneAndDelete({ name })
  await disconnectDb()

  res.json(mongoResponse).status(200)
})

app.post('/disconnect', async (req: Request, res: Response) => {
  await disconnectDb()
  res.send('OK')
})


app.listen(process.env.PORT || 8080, () => {
  console.log('App listening to port 8080')
})
