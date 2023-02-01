import "dotenv/config";
import express from "express";
import { SocketConnection } from "./socketConnection";

//Create http server
const app = express();

app.use(express.json());

app.get("*", (request, response) => {
  return response.json({ message: "404" });
});

//Initiaize socket
new SocketConnection(app)
  .createSocketConnection()
  .listnerServer(`Api inciada na porta ${process.env.PORT}`);
