import cors from 'cors';
import express, { type ErrorRequestHandler } from 'express';
import mongoose from 'mongoose';
import { apiRouter } from './routes/api.js';

export const app = express();

app.use(cors());
app.use(express.json());
app.use('/api', apiRouter);

app.use((_request, response) => {
  response.status(404).json({ error: 'Not found' });
});

const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  if (error instanceof mongoose.Error.ValidationError || error instanceof mongoose.Error.CastError) {
    response.status(400).json({ error: error.message });
    return;
  }

  if (typeof error === 'object' && error !== null && 'code' in error && error.code === 11000) {
    response.status(409).json({ error: 'A record with that unique value already exists' });
    return;
  }

  console.error(error);
  response.status(500).json({ error: 'Internal server error' });
};

app.use(errorHandler);