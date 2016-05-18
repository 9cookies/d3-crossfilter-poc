# D3 Crossfilter POC

This repository contains some simple data visualization tools built on top of D3 + Crossfilter.

## delolap

Shows analysis of tracked deliveries (distribution of delivery times, delays, tracking scores, etc.).
To run the app, checkout this repo and create a config file `:
- `cd delolap`
- create config file `local.env.js` (with DB-related properties) inside the `config` directory based on the `local.env.sample.js` 
- `npm install && bower install && npm start`

Go to `http://localhost:3000` and wait for the data to be loaded. First load on STG environment is slow and can take up to 1-2 minutes.
