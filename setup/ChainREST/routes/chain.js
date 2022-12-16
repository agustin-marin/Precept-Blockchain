import express from "express";
import { Pool } from "threads";
import workerGet from "./worker-get.js";
import workerPut from "./worker-put.js";
import boom from "boom"; // librería de manejo de errores
import joi from "joi"; // librería de middleware de validación opcional

const router = express.Router();

router.get("/", (req, res) => {
  res.status(200).send("This is the ledger endpoint GET \n Endpoints: \n /chain/events \n POST /chain/publish");
});

router.get("/events", async (req, res, next) => {

  const schema = joi.object().keys({
    query: joi.string().required()
  });
  const result = schema.validate(req.body);
  if (result.error) {
    return next(boom.badRequest("Entrada inválida"));
  }

  try {
    const pool = new Pool(1);
    const queryChaincodeResponse = await pool.exec(workerGet, req);
    console.debug(`worker: ${typeof queryChaincodeResponse} -> ${queryChaincodeResponse}`);
    if (typeof queryChaincodeResponse !== "undefined") {
      res.status(200).send(queryChaincodeResponse.queryResult);
    } else {
 
      throw boom.serverTimeout("Error de TIMEOUT al obtener eventos");
    }
    res.end();
    pool.destroy();
  } catch (error) {
    console.error(error);
    // mensaje de error más detallado utilizando la librería boom
    return next(boom.internal("Error al obtener eventos: ", error));
  }
});
router.post("/publish", async (req, res, next) => {
  // validación de entrada
  const schema = joi.object().keys({
    event: joi.string().required()
  });
  const result = schema.validate(req.body);
  if (result.error) {
    return next(boom.badRequest("Entrada inválida"));
  }

  try {
    const pool = new Pool(1);
    const queryChaincodeResponse = await pool.exec(workerPut, req);
    console.debug(`worker: ${typeof queryChaincodeResponse} -> ${queryChaincodeResponse}`);
    if (typeof queryChaincodeResponse !== "undefined") {
      res.status(200).send(queryChaincodeResponse.queryResult);
    } else {
      // manejo de errores específico para el caso en el que el tipo de respuesta del worker sea "undefined"
      throw boom.serverTimeout("Error de TIMEOUT al publicar evento");
    }
    res.end();
    pool.destroy();
  } catch (error) {
    console.error(error);
    // mensaje de error más detallado utilizando la librería boom
    return next(boom.internal("Error al publicar evento: ", error));
  }
});

module.exports = router;
