const express = require('express')
const cors = require('cors');
const jwt = require('jsonwebtoken');
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
    const usersCollection = client.db('laptobZone').collection('user')

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
    app.get('/buy', verifyJWT, async(req, res) => {
      const email = req.query.email;
      const query = {email: email};
      const result = await buyCollection.find(query).toArray();
      res.send(result)
    })

    // JWT TOKEN
    app.get('/jwt', async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const user = await usersCollection.findOne(query);

      if (user) {
          const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, { expiresIn: '1d' })
          return res.send({ accessToken: token });
      }
      res.status(403).send({ accessToken: '' })
  })

    // user product buy
    app.post('/buy', async(req, res) => {
      const buy = req.body;
      const result = await buyCollection.insertOne(buy);
      res.send(result)
    })

    // user collection
    app.post('/users', async(req, res) => {
      const user = req.body;
      const result = await usersCollection.insertOne(user);
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