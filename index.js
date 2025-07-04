require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const port = process.env.port || 3000;

// middleware
app.use(cors());
app.use(express.json());

// mongoDB
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.MONGODB_USER}:${process.env.MONGODB_PASSWORD}@cluster0.bmuc12j.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    const activeUsersCollection = client
      .db("gardenNestDB")
      .collection("activeUsers");
    const tipsCollection = client.db("gardenNestDB").collection("shareTips");

    app.get("/users", async (req, res) => {
      const result = await activeUsersCollection.find().toArray();
      res.send(result);
    });

    app.get("/users/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: id };
      const result = await activeUsersCollection.findOne(query);
      res.send(result);
      console.log(result);
    });

    app.get("/activeUsers", async (req, res) => {
      const result = await activeUsersCollection
        .find({ status: "Active" })
        .limit(6)
        .toArray();
      res.send(result);
    });

    app.get("/trendingTips", async (req, res) => {
      const result = await tipsCollection
        .aggregate([
          { $match: { status: "Public" } },
          {
            $addFields: {
              likesCount: { $size: { $ifNull: ["$likedBy", []] } },
            },
          },
          { $sort: { likesCount: -1 } },
          { $limit: 6 },
        ])
        .toArray();
      res.send(result);
    });

    app.post("/tips", async (req, res) => {
      const newUser = req.body;
      const result = await tipsCollection.insertOne(newUser);
      res.send(result);
    });

    app.get("/tips", async (req, res) => {
      const result = await tipsCollection.find().toArray();
      res.send(result);
    });

    app.get("/browseTips", async (req, res) => {
      const result = await tipsCollection.find({ status: "Public" }).toArray();
      res.send(result);
    });

    app.get("/browseTips/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await tipsCollection.findOne(query);
      res.send(result);
    });

    app.post("/myTips", async (req, res) => {
      const { email } = req.body;
      const result = await tipsCollection.find({ email: email }).toArray();
      res.send(result);
    });

    app.delete("/tips/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await tipsCollection.deleteOne(query);
      res.send(result);
    });

    app.put("/tips/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateTips = req.body;
      const updateDoc = {
        $set: updateTips,
      };
      const result = await tipsCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    app.get("/tips/:level", async (req, res) => {
      const levelData = req.params.level;
      const result = await tipsCollection
        .find({ level: levelData, status: "Public" })
        .toArray();
      res.send(result);
    });

    app.patch("/tips/:id/like", async (req, res) => {
      const { email } = req.body;
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $addToSet: { likedBy: email },
      };
      const result = await tipsCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    app.post("/myMostLikedTip", async (req, res) => {
      const { email } = req.body;
      const result = await tipsCollection
        .aggregate([
          { $match: { email } },
          {
            $addFields: {
              likesCount: { $size: { $ifNull: ["$likedBy", []] } },
            },
          },
          { $sort: { likesCount: -1 } },
          { $limit: 1 },
        ])
        .toArray();
      if (result.length > 0) {
        res.send(result[0]);
      } else {
        res.send(null);
      }
    });

    app.get("/sortedTips", async (req, res) => {
      const sortOrder = req.header("sort-order") === "old" ? 1 : -1;
      const result = await tipsCollection
        .aggregate([
          { $match: { status: "Public" } },
          { $sort: { createdAt: sortOrder } },
        ])
        .toArray();
      res.send(result);
    });
  } finally {
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("server is running");
});

app.listen(port, () => {
  console.log(`Port is running on ${port}`);
});
