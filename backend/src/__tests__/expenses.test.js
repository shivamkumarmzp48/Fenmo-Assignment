const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

const { createApp } = require("../app");
const { connectToDb } = require("../db");

let mongo;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await connectToDb(mongo.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongo) await mongo.stop();
});

afterEach(async () => {
  const collections = await mongoose.connection.db.collections();
  await Promise.all(collections.map((c) => c.deleteMany({})));
});

test("POST /expenses is idempotent via Idempotency-Key", async () => {
  const app = createApp();
  const key = "test-key-1";

  const body = {
    amount: "12.50",
    category: "Food",
    description: "Lunch",
    date: "2026-02-17",
  };

  const first = await request(app).post("/expenses").set("Idempotency-Key", key).send(body);
  expect(first.status).toBe(201);
  expect(first.body.expense).toBeDefined();

  const second = await request(app).post("/expenses").set("Idempotency-Key", key).send(body);
  expect(second.status).toBe(200);
  expect(second.body.idempotentReplay).toBe(true);
  expect(second.body.expense.id).toBe(first.body.expense.id);
});

test("GET /expenses?sort=date_desc sorts by date newest first", async () => {
  const app = createApp();

  await request(app)
    .post("/expenses")
    .set("Idempotency-Key", "k1")
    .send({ amount: "1", category: "A", description: "old", date: "2026-01-01" });
  await request(app)
    .post("/expenses")
    .set("Idempotency-Key", "k2")
    .send({ amount: "1", category: "A", description: "new", date: "2026-02-01" });

  const res = await request(app).get("/expenses").query({ sort: "date_desc" });
  expect(res.status).toBe(200);
  expect(res.body.expenses).toHaveLength(2);
  expect(res.body.expenses[0].description).toBe("new");
});

