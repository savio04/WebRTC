import "dotenv/config";
import express from "express";
import { SocketConnection } from "./socketConnection";

//create http server
const app = express();

app.use(express.json());

app.get("*", (request, response) => {
  return response.json({ message: "404" });
});

//create socket connection
new SocketConnection(app)
  .createSocketConnection()
  .listnerServer(`Api iniciada na porta ${process.env.PORT}`);
