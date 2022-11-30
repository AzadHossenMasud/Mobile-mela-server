const express = require("express");
const app = express();
const cors = require("cors");
const port = process.env.PORT || 5000;
const jwt = require("jsonwebtoken");

require("dotenv").config();

// middleware
app.use(cors());
app.use(express.json());
console.log(process.env.DB_PASSWORD);

//  Mongo DB

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.2kitjkk.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

const verifyJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: "unauthorize access" });
  }

  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN, (err, decoded) => {
    if (err) {
      return res.status(403).send({ message: "forbided access" });
    }
    req.decoded = decoded;
    next();
  });
};

const run = async () => {
  try {
    const usersCollection = client.db("phoneMela").collection("users");
    const phonesCollection = client.db("phoneMela").collection("phones");
    const advertiseCollection = client.db("phoneMela").collection("advertise");
    const bookingCollection = client.db("phoneMela").collection("booking");

    // verify
    const verifySeller = async (req, res, next) => {
      const decodedEmail = req.decoded.email;
      // console.log(decodedEmail);
      const query = {
        email: decodedEmail,
      };

      const user = await usersCollection.findOne(query);

      if (user?.userType !== "seller") {
        return res.status(403).send({ message: "forbidden access" });
      }
      next();
    };

    const verifyAdmin = async (req, res, next) => {
      const decodedEmail = req.decoded.email;
      // console.log(decodedEmail);
      const query = {
        email: decodedEmail,
      };

      const user = await usersCollection.findOne(query);

      if (user?.userType !== "admin") {
        return res.status(403).send({ message: "forbidden access" });
      }
      next();
    };

    // GET

    app.get("/catagories/:id", async (req, res) => {
      const id = req.params.id;
      const query = {
        catagoryId: id,
        status: "available",
      };
      const phones = await phonesCollection.find(query).toArray();
      res.send(phones);
    });

    app.get("/users", verifyJWT, async (req, res) => {
      const email = req.query.email;
      const query = {
        email: email,
      };
      const user = await usersCollection.findOne(query);
      // console.log(user);
      res.send(user);
    });

    app.get("/myphones", verifyJWT, verifySeller, async (req, res) => {
      const email = req.query.email;
      // console.log(email)
      const query = {
        sellerEmail: email,
      };

      const phones = await phonesCollection.find(query).toArray();
      res.send(phones);
    });

    app.get("/allseller", verifyJWT, verifyAdmin, async (req, res) => {
      const query = {
        userType: "seller",
      };

      const sellers = await usersCollection.find(query).toArray();
      res.send(sellers);
    });

    app.get("/allbuyer", verifyJWT, verifyAdmin, async (req, res) => {
      const query = {
        userType: "buyer",
      };

      const buyers = await usersCollection.find(query).toArray();
      res.send(buyers);
    });

    app.get("/advertise", async (req, res) => {
      const advertiseItemId = await advertiseCollection.find({}).toArray();

      const phoneId = advertiseItemId[0].phoneId;
      const query = {
        _id: ObjectId(phoneId),
      };

      const advertiseItem = await phonesCollection.findOne(query);

      res.send(advertiseItem);
    });

    // POST
    app.post("/users", async (req, res) => {
      const userInfo = req.body;

      const query = {
        email: userInfo.email,
      };

      const user = await usersCollection.findOne(query);
      // console.log(user)
      if (!user) {
        const result = await usersCollection.insertOne(userInfo);
        return res.send(result);
      }
      res.send({ achknowledge: true });
    });

    app.post("/addphone", verifyJWT, verifySeller, async (req, res) => {
      const phone = req.body;
      const result = await phonesCollection.insertOne(phone);
      res.send(result);
    });

    app.post("/bookingphone", verifyJWT, async (req, res) => {
      const bookPhone = req.body;
      const phoneId = bookPhone.phoneId;

      const filter = {
        _id: ObjectId(phoneId),
      };
      const options = {
        upsert: true,
      };

      const updateDoc = {
        $set: {
          status: "booked",
        },
      };

      const updatePhone = await phonesCollection.updateOne(
        filter,
        updateDoc,
        options
      );

      const result = await bookingCollection.insertOne(bookPhone);

      // console.log(updatePhone)
      res.send(result);
    });

    // PUT

    app.put("/allseller/:id", verifyJWT, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const filter = {
        _id: ObjectId(id),
      };
      const options = {
        upsert: true,
      };

      const updateSeller = {
        $set: {
          isVerified: true,
        },
      };

      const result = await usersCollection.updateOne(
        filter,
        updateSeller,
        options
      );
      res.send(result);
    });

    app.post("/advertise", verifyJWT, verifySeller, async (req, res) => {
      const advertiseItem = req.body;
      console.log(advertiseItem.phoneId);
      const filter = { _id: ObjectId("6386f68087452b5e18d69300") };

      const options = {
        upsert: true,
      };

      const updateId = {
        $set: {
          phoneId: advertiseItem.phoneId,
        },
      };

      const result = await advertiseCollection.updateOne(
        filter,
        updateId,
        options
      );
      res.send(result);
    });

    // JWT
    app.get("/jwt", async (req, res) => {
      const email = req.query.email;
      const query = {
        email: email,
      };

      const user = await usersCollection.findOne(query);
      if (user) {
        const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, {
          expiresIn: "24h",
        });
        return res.send({ accessToken: token });
      }
      res.status(403).send({ accessToken: "forbidded" });
    });
  } finally {
  }
};

run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Phone Mela server running on port ${port}`);
});
