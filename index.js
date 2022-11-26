const express = require('express')
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();

const app = express()
const port = process.env.PORT || 5000

// middleware
app.use(cors())
app.use(express.json())



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.2elctou.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
  try{
    const categoriesCollection = client.db('laptobZone').collection('categories')
    const productsCollection = client.db('laptobZone').collection('products')
    const buyCollection = client.db('laptobZone').collection('buy')

    app.get('/categories', async(req, res) => {
      const query = {}
      const categories = await categoriesCollection.find(query).toArray()
      res.send(categories)
    })


    // // categories:id 
    // app.get('/categories/:id', async(req, res) => {
    //   const id = req.params.id;
    //   const query = {_id: ObjectId(id)}
    //   const products = await categoriesCollection.find(query).toArray();
    //   res.send(products)
    // })

    // categories:id 
    app.get('/categories/:id', async(req, res) => {
      const id = req.params.id;
      const query = {category_id: id}
      const products = await categoriesCollection.find(query).toArray();
      res.send(products)
    })

    // my orders
    app.get('/buy', async(req, res) => {
      const email = req.query.email;
      console.log(email)
      const query = {email: email};
      const result = await buyCollection.find(query).toArray();
      res.send(result)
    })

    // user product buy
    app.post('/buy', async(req, res) => {
      const buy = req.body;
      const result = await buyCollection.insertOne(buy);
      res.send(result)
    })


  }

  finally{

  }
}
run().catch(err => console.log(err))


app.get('/', (req, res) => {
  res.send('laptob zone server running')
})

app.listen(port, () => {
  console.log(`laptob zone server running on port ${port}`)
})