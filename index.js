const express = require('express')
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();

const stripe = require("stripe")(process.env.STRIPE_SECRIT_KEY);

const app = express()
const port = process.env.PORT || 5000

// middleware
app.use(cors())
app.use(express.json())

// jwt
function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send('unauthorized access')
  }
  const token = authHeader.split(' ')[1]

  jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
    if (err) {
      return res.status(401).send({ message: 'unauthorized access' })
    }
    req.decoded = decoded;
    next();
  })
}

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.2elctou.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
  try {
    const categoriesCollection = client.db('laptobZone').collection('categories')
    const productsCollection = client.db('laptobZone').collection('products')
    const buyCollection = client.db('laptobZone').collection('buy')
    const usersCollection = client.db('laptobZone').collection('user')
    const paymentsCollection = client.db('laptobZone').collection('payments')

    app.get('/categories', async (req, res) => {
      const query = {}
      const categories = await categoriesCollection.find(query).toArray()
      res.send(categories)
    })


    // // categories:id 
    app.get('/products/:categoryName', async(req, res) => {
      const id = req.params.id;
      const query = {categoryName: id}
      const result = await productsCollection.find(query).toArray();
      res.send(result)
    })

    // categories:id 
    // app.get('/categories/:id', async (req, res) => {
    //   const id = req.params.id;
    //   const query = { category_id: id }
    //   const products = await categoriesCollection.find(query).toArray();
    //   res.send(products)
    // })

    // products
    app.get('/products', async(req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const result = await productsCollection.find(query).toArray();
      res.send(result)
    })

    // my orders
    app.get('/buy',  async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const result = await buyCollection.find(query).toArray();
      res.send(result)
    })

    // user order payment
    app.get('/buy/:id', async(req, res) => {
      const id = req.params.id;
      const query = {_id: ObjectId(id)};
      const result = await buyCollection.findOne(query);
      res.send(result)
    })

    // JWT TOKEN
    // app.get('/jwt', async (req, res) => {
    //   const email = req.query.email;
    //   const query = { email: email };
    //   const user = await usersCollection.findOne(query);

    //   if (user) {
    //     const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, { expiresIn: '1d' })
    //     return res.send({ accessToken: token });
    //   }
    //   res.status(403).send({ accessToken: '' })
    // })

    // user display in website
    app.get('/users', async (req, res) => {
      const query = {}
      const user = await usersCollection.find(query).toArray()
      res.send(user)
    })

    // Seller display in website
    app.get('/sellers', async (req, res) => {
      const  buyerSeller = req.query.buyerSeller;
      const query = {buyerSeller: buyerSeller}
      const result = await usersCollection.find(query).toArray()
      res.send(result)
    })

    // Seller display in website
    app.get('/buyers', async (req, res) => {
      const  buyerSeller = req.query.buyerSeller;
      const query = {buyerSeller: buyerSeller}
      const result = await usersCollection.find(query).toArray()
      res.send(result)
    })

    // admin role
    // app.get('/users/admin/:email', async(req, res) => {
    //   const email = req.params.email;
    //   const query = {email};
    //   const user = await usersCollection.findOne(query);
    //   res.send({isAdmin: user?.role === 'admin'});
    // })
    // admin role
    app.get('/users/admin/:email', async(req, res) => {
      const email = req.params.email;
      const query = {email};
      const user = await usersCollection.findOne(query);
      res.send({isAdmin: user?.buyerSeller === 'admin'});
    })

    // seller role
    app.get('/users/seller/:email', async(req, res) => {
      const email = req.params.email;
      const query = {email};
      const user = await usersCollection.findOne(query);
      res.send({isSeller: user?.buyerSeller === 'seller'});
    })

    // seller delete
    app.delete('/users/seller/:id', async (req, res) => {
      const id = req.params.id;
      const filter = {_id: ObjectId(id)};
      const result = await usersCollection.deleteOne(filter);
      res.send(result)
    })
    // buyer role
    app.get('/users/buyer/:email', async(req, res) => {
      const email = req.params.email;
      const query = {email};
      const user = await usersCollection.findOne(query);
      res.send({isBuyer: user?.buyerSeller === 'buyer'});
    })

    // seller delete
    app.delete('/users/buyer/:id', async (req, res) => {
      const id = req.params.id;
      const filter = {_id: ObjectId(id)};
      const result = await usersCollection.deleteOne(filter);
      res.send(result)
    })

    // user update make a admin
    app.put('/users/admin/:id', verifyJWT, async (req, res) => {
      const decodedEmail = req.decoded.email;
      const query = {email: decodedEmail};
      const user = await usersCollection.findOne(query);

      if(user?.role !== 'admin') {
        return res.status(403).send({message: 'forbidden access'})
      }

      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const options = { upsert: true };
      const updatedDoc = {
          $set: {
              role: 'admin',
          }
      }
      const result = await usersCollection.updateOne(filter, updatedDoc, options);
      res.send(result)
  })

  // Payment Method
  app.post('/create-payment-intent', async (req, res) => {
    const order = req.body;
    const price = order.price;
    const amount = price * 100;

    const paymentIntent = await stripe.paymentIntents.create({
        currency: 'usd',
        amount: amount,
        "payment_method_types": [
            "card"
        ]
    })
    res.send({
        clientSecret: paymentIntent.client_secret,
    });
})


// customer payment store in the database
app.post('/payments', async(req, res) => {
  const payment = req.body;
  const result = await paymentsCollection.insertOne(payment);

  const id = payment.orderId;
  const filter = {_id: ObjectId(id)}
  const updatedDoc= {
      $set: {
          paid: true,
          transactionId: payment.transactionId
      }
  }
  const updatedResult = await buyCollection.updateOne(filter, updatedDoc)
  res.send(result);
})

  // products post database
  app.post('/products', async(req, res) => {
    const product = req.body;
    const result = await productsCollection.insertOne(product);
    res.send(result);
  })

    // user product buy
    app.post('/buy', async (req, res) => {
      const buy = req.body;
      const result = await buyCollection.insertOne(buy);
      res.send(result)
    })

    // user collection
    app.post('/users', async (req, res) => {
      const user = req.body;
      const result = await usersCollection.insertOne(user);
      res.send(result)
    })


    // user delete
    app.delete('/users/:id', verifyJWT, async (req, res) => {
      const id = req.params.id;
      const filter = {_id: ObjectId(id)};
      const result = await usersCollection.deleteOne(filter);
      res.send(result)
    })

  }

  finally {

  }
}
run().catch(err => console.log(err))


app.get('/', (req, res) => {
  res.send('laptob zone server running')
})

app.listen(port, () => {
  console.log(`laptob zone server running on port ${port}`)
})