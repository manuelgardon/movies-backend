import express from 'express';

const server = express();
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let nestApp: any;

export default async function handler(
  req: express.Request,
  res: express.Response,
) {
  if (!nestApp) {
    // Dynamic require so @vercel/node does not statically analyse @nestjs/* imports
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { bootstrap } = require('../dist/src/bootstrap');
    nestApp = await bootstrap(server);
  }
  server(req, res);
}
