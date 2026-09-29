# Currency Converter

A small full-stack project for web development students.

**Stack:** HTML, CSS, Tailwind CSS (CDN), vanilla JavaScript, Node.js + Express  
**API:** [Frankfurter v2](https://frankfurter.dev/) (no API key needed)

## Run it

```bash
npm install
npm start
```

Open http://localhost:3000 (Node.js 18 or newer required).

## How it works

- `server.js` serves `public/` and exposes two routes that call Frankfurter and cache results for 10 minutes:
  - `GET /api/currencies`
  - `GET /api/rate?from=USD&to=PKR`
- `public/js/app.js` fills the dropdowns, calls `/api/rate`, and multiplies the amount by the rate.
- Layout is mobile-first: the From / swap / To controls stack on phones and sit in a row from `sm` (640px) up. Dark mode follows the device setting.

## Ideas to extend

1. Add a 30-day trend chart using `/v2/rates?from=...&quotes=PKR`.
2. Remember the last pair in `localStorage`.
3. Replace the Tailwind CDN with the Tailwind CLI build for production.
4. Add tests for the API routes.
