# FXQL Statement Parser

A Foreign Exchange Query Language (FXQL) Statement Parser. It is designed to parse exchange rate data submitted by Bureau De Change (BDC) operations and store the standardized data in a PostgreSQL database.

## Features

- Accepts FXQL statements via API calls.
- Validates the FXQL syntax and ensures that the data adheres to the specified rules.
- Stores valid entries in the database.
- Returns appropriate responses for both successful and failed operations.
- Handles multiple FXQL statements in a single request, with a maximum of 1000 currency pairs per statement.
- Provides detailed error messages with line numbers and character positions when there are invalid statements.

## Setup Instructions

### Local Development Requirements

To run this application locally, you need the following tools:

- **Node.js**: Runtime environment.
- **NestJS**: Framework for building scalable server-side applications.
- **TypeORM**: ORM for database interactions.
- **PostgreSQL**: Database for storing exchange rates.

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/edwinedjokpa/fxql-parser.git
   cd fxql-parser
   ```

2. Install the dependencies:

   ```bash
   npm install
   ```

3. Set up PostgreSQL:

   - Make sure PostgreSQL is running on your local machine or use a hosted database (e.g., Heroku, Railway).
   - Create a new database named `fxql`.

   ```bash
   psql -U youruser
   CREATE DATABASE fxql;
   ```

4. Set up the environment variables in a `.env` file. You can base this on the example:

   ```env
   DB_HOST=localhost
   DB_PORT=5432
   DB_DATABASE=fxql
   DB_USERNAME=youruser
   DB_PASSWORD=yourpassword
   DB_SSL_MODE=true
   ```

5. Start the application:

   ```bash
   npm run start
   ```

   The API should now be accessible at `http://localhost:3000`.

## FXQL Module

### Overview

The **FXQL Module** is a core part of the **FXQL Statement Parser** application. It handles the parsing, validation, and processing of **FXQL (Foreign Exchange Query Language)** statements, which are submitted via the API. This module validates the structure of FXQL statements, extracts exchange rate information, stores valid entries in the database, and returns appropriate responses for both successful and failed operations.

---

### Module Structure

The FXQL module is designed with the following responsibilities:

1. **Parse FXQL Statements**: The module accepts FXQL statements and breaks them down into structured data.
2. **Validate FXQL Syntax**: It ensures that the FXQL statements conform to the defined syntax and rules.
3. **Store Parsed Data**: After validation, the parsed FXQL data is stored in the PostgreSQL database.
4. **Return Success or Error Responses**: It returns detailed error messages when a statement is invalid and sends confirmation when data is successfully parsed and stored.

---

## FXQL Statement Specification

### Basic Structure

An FXQL statement follows this structure:

Where:

- **CURR1**: Source currency (e.g., USD, EUR, GBP). Must be exactly 3 uppercase characters.
- **CURR2**: Destination currency (e.g., USD, EUR, GBP). Must be exactly 3 uppercase characters.
- **BUY**: The buy rate for the currency pair. A numeric value in `CURR2` per unit of `CURR1`.
- **SELL**: The sell rate for the currency pair. A numeric value in `CURR2` per unit of `CURR1`.
- **CAP**: The maximum transaction amount in `CURR1`. This must be a whole number, and can be zero to indicate no cap.

---

## Features and Responsibilities

The FXQL module contains the following key functionalities:

### 1. **FXQL Statement Parsing**

The module parses FXQL statements into structured data. It identifies each part of the statement (currency pairs, rates, caps), ensuring that the syntax is valid and complies with the defined structure.

#### Example FXQL Statement:

```plaintext
USD-GBP {
    BUY 100
    SELL 200
    CAP 50000
}
```

It is then parsed into a structural data

- The parsing is done due to the help of a regex.

```json
{
  "sourceCurrency": "USD",
  "destinationCurrency": "GBP",
  "buyPrice": 100,
  "sellPrice": 200,
  "capAmount": 50000
}
```

### 2. Syntax Validation

The FXQL module ensures that the submitted statements conform to the following validation rules:

- Currency Codes: Both source and destination currencies must be exactly 3 uppercase characters.
- Valid: USD, GBP, EUR
- Invalid: usd, USDT, US
- Numeric Values: The BUY, SELL, and CAP values must follow strict rules:
- BUY and SELL must be numeric values (positive floating-point numbers).
- CAP must be an integer, and cannot be negative or a decimal value. It can be 0 to indicate no cap.

### 3. Storing Data in PostgreSQL

The parsed and validated FXQL statements are stored in the database under the currency_rates table. Each statement contains details about the currency pair, the buy and sell prices, and the cap amount.

### 4. Updating Currency Pairs

- After the FXQL statement is parsed andthe pairs created, the pairs are validated to check if they conform to the requirements, and then inserted into the database. However, if a pair already exists, it atores and reflects only the latest values provided. That is, if we have a duplicate pair in a statement like;

```plain
  USD-GBP {
   BUY 0.85
   SELL 0.90
   CAP 10000
  }
  USD-GBP {
   BUY 0.86
   SELL 0.91
   CAP 12000
  }

```

- It will check if the pair exists in the database, and update the pair with the latest values provided, if the pair doesn't exist, it saves the latest value provide.

```json
{
  "success": true,
  "message": "Rates Parsed Successfully.",
  "code": "FXQL-200",
  "data": [
    {
      "entryId": 1,
      "sourceCurrency": "USD",
      "destinationCurrency": "GBP",
      "sellPrice": 0.86,
      "buyPrice": 0.91,
      "capAmount": 12000
    }
  ]
}
```

## Table Structure

- The database table associated with exchange_rates that stores saved pairs.

| Column                | Type      | Description                                                                  |
| --------------------- | --------- | ---------------------------------------------------------------------------- |
| `entryId`             | INTEGER   | Primary key, automatically generated.                                        |
| `sourceCurrency`      | VARCHAR   | The source currency (e.g., USD, EUR).                                        |
| `destinationCurrency` | VARCHAR   | The destination currency (e.g., GBP, JPY).                                   |
| `currencyPair`        | VARCHAR   | A unique string representing the currency pair (e.g., USD/GBP).              |
| `buyPrice`            | DECIMAL   | The buy price for the currency pair, with precision up to 6 decimal places.  |
| `sellPrice`           | DECIMAL   | The sell price for the currency pair, with precision up to 6 decimal places. |
| `capAmount`           | INTEGER   | The cap amount for the currency pair transaction.                            |
| `createdAt`           | TIMESTAMP | Timestamp for when the record was created.                                   |
| `updatedAt`           | TIMESTAMP | Timestamp for when the record was last updated.                              |

## API Documentation

This section now contains details about the `POST /fxql-statements` endpoint, the request body, and the possible responses (success, error 400, and error 500).

- **Swagger UI Link**: I've provided a link to access the Swagger UI documentation, which will be available at `/docs` when the NestJS app is running.

This setup allows users to interact with your API, explore available endpoints, and test requests using the Swagger interface. Let me know if you need further customization!

### POST /fxql-statements

#### Request Body

```json
{
  "FXQL": "USD-GBP {\\n BUY 100\\n SELL 200\\n CAP 93800\\n}"
}
```

### Response Success

```json
{
  "success": true,
  "message": "Rates Parsed Successfully.",
  "code": "FXQL-200",
  "data": [
    {
      "entryId": 1,
      "sourceCurrency": "USD",
      "destinationCurrency": "GBP",
      "sellPrice": 200,
      "buyPrice": 100,
      "capAmount": 93800
    }
  ]
}
```

### POST /fxql-statements

#### Request Body

```json
{
  "FXQL": "USD-GBP {\\n  BUY 0.85\\n  SELL 0.90\\n  CAP 10000\\n}\\n\\nEUR-JPY {\\n  BUY 145.20\\n  SELL 146.50\\n  CAP 50000\\n}\\n\\nNGN-USD {\\n  BUY 0.0022\\n  SELL 0.0023\\n  CAP 2000000\\n}"
}
```

### Response Success

```json
{
  "success": true,
  "message": "FXQL Statement Parsed Successfully.",
  "code": "FXQL-201",
  "data": [
    {
      "EntryId": 1,
      "SourceCurrency": "USD",
      "DestinationCurrency": "GBP",
      "SellPrice": 0.85,
      "BuyPrice": 0.9,
      "CapAmount": 10000
    },
    {
      "EntryId": 2,
      "SourceCurrency": "EUR",
      "DestinationCurrency": "JPY",
      "SellPrice": 145.2,
      "BuyPrice": 146.5,
      "CapAmount": 50000
    },
    {
      "EntryId": 3,
      "SourceCurrency": "NGN",
      "DestinationCurrency": "USD",
      "SellPrice": 0.0022,
      "BuyPrice": 0.0023,
      "CapAmount": 2000000
    }
  ]
}
```
