# promptlog

A lightweight REST API for logging, tagging, and querying LLM prompt/response pairs.

## Install

```
npm install
```

## Run

```
PORT=3000 npm start
```

The `PORT` environment variable sets the listening port (default: 3000).

## Test

```
npm test
```

## API

| Method | Path           | Description                                         |
|--------|----------------|-----------------------------------------------------|
| GET    | /healthz       | Health check — returns `{ status: "ok" }`           |
| POST   | /api/logs      | Create a new log entry (prompt + response required) |
| GET    | /api/logs      | List logs (filter by engine, tag; limit param)      |
| GET    | /api/logs/:id  | Retrieve a single log entry by ID                   |
| DELETE | /api/logs/:id  | Delete a log entry by ID                            |
