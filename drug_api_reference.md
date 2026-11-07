# Drug API Reference

## Overview

A REST API for managing and searching drug information using **Node.js, Express, MongoDB, and Mongoose**.

### Base URL

```text
http://localhost:3000/api
```

---

## Data Model

Each drug document contains:

| Field | Type | Constraints / Description |
|---|---|---|
| `_id` | ObjectId | MongoDB-generated unique identifier |
| `brand_name` | String | Maximum 50 characters |
| `generic_name` | String | Maximum 60 characters |
| `dosage_type` | String | Maximum 30 characters |
| `strength` | String | Maximum 30 characters |
| `pharmaceutical` | String | Maximum 50 characters |
| `unit_price` | Number | Minimum 0, maximum 999.99 |
| `createdAt` | Date | Automatically generated |
| `updatedAt` | Date | Automatically generated |

---

# Endpoints

## 1. Get All Drugs

### Request

```http
GET /api/drugs?page=1&limit=20
```

### Query Parameters

| Parameter | Type | Default | Description |
|---|---|---:|---|
| `page` | Integer | `1` | Page number |
| `limit` | Integer | `20` | Number of records per page; maximum 100 |

### Example

```http
GET /api/drugs?page=2&limit=20
```

### Response

```json
{
  "data": [
    {
      "_id": "671234567890abcdef123456",
      "brand_name": "Napa",
      "generic_name": "Paracetamol",
      "dosage_type": "Tablet",
      "strength": "500 mg",
      "pharmaceutical": "Beximco Pharmaceuticals Ltd.",
      "unit_price": 1.2,
      "createdAt": "2026-10-01T10:00:00.000Z",
      "updatedAt": "2026-10-01T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 12500,
    "total_pages": 625,
    "has_next_page": true,
    "has_previous_page": false
  }
}
```

---

## 2. Search Drugs by Brand Name

Searches for drugs whose brand name contains the supplied text.

### Request

```http
GET /api/drugs/search?brand_name=napa&page=1&limit=20
```

### Query Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `brand_name` | String | Yes | Partial brand name to search for |
| `page` | Integer | No | Page number; default `1` |
| `limit` | Integer | No | Results per page; default `20`, maximum `100` |

The search is **case-insensitive**.

For example:

```http
GET /api/drugs/search?brand_name=napa
```

may match:

```text
Napa
Napa Extra
Napa Extend
Napa One
```

### Response

```json
{
  "data": [
    {
      "_id": "671234567890abcdef123456",
      "brand_name": "Napa",
      "generic_name": "Paracetamol",
      "dosage_type": "Tablet",
      "strength": "500 mg",
      "pharmaceutical": "Beximco Pharmaceuticals Ltd.",
      "unit_price": 1.2
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 12,
    "total_pages": 1,
    "has_next_page": false,
    "has_previous_page": false
  }
}
```

---

## 3. Get Brand Names from Generic Name

Get a list of brand names from the given generic name

### Request

```http
GET /api/drugs/brands?generic_name=Paracetamol&page=1&limit=20
```

### Query Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `generic_name` | String | Yes | Exact generic name to find brand names |
| `page` | Integer | No | Page number; default `1` |
| `limit` | Integer | No | Results per page; default `20`, maximum `100` |

The search is **case-insensitive**.

For example:

```http
GET /api/drugs/brands?generic_name=Paracetamol&page=1&limit=20
```

may match:

```text
Paracetamol
paracetamol
PARACETAMOL
```

### Response

```json
{
  "generic_name": "Paracetamol",
  "brands_names": [
    {
      "_id": "6aee27d3da06c4abeadd0ad4",
      "brand_name": "2 A A",
      "generic_name": "Paracetamol",
      "dosage_type": "Suspension",
      "strength": "120 mg/5 ml",
      "pharmaceutical": "Mystic Pharmaceuticals Ltd.",
      "unit_price": 0,
      "__v": 0,
      "createdAt": "2026-11-06T19:17:39.783Z",
      "updatedAt": "2026-11-06T19:17:39.783Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 2,
    "total": 370,
    "total_pages": 185,
    "has_next_page": true,
    "has_previous_page": false
  }
}
```

---

## 4. Get Alternative Brands by Drug ID

Returns other drug brands with the same generic name as a selected drug.

### Request

```http
GET /api/drugs/:id/alternatives?page=1&limit=20
```

### Example

```http
GET /api/drugs/671234567890abcdef123456/alternatives
```

### Path Parameter

| Parameter | Type | Description |
|---|---|---|
| `id` | ObjectId | MongoDB `_id` of the drug |

### Query Parameters

| Parameter | Type | Default | Description |
|---|---|---:|---|
| `page` | Integer | `1` | Page number |
| `limit` | Integer | `20` | Results per page; maximum 100 |

### Response

```json
{
  "drug": {
    "_id": "671234567890abcdef123456",
    "brand_name": "Napa",
    "generic_name": "Paracetamol",
    "dosage_type": "Tablet",
    "strength": "500 mg",
    "pharmaceutical": "Beximco Pharmaceuticals Ltd.",
    "unit_price": 1.2
  },
  "alternatives": [
    {
      "_id": "671234567890abcdef654321",
      "brand_name": "Ace",
      "generic_name": "Paracetamol",
      "dosage_type": "Tablet",
      "strength": "500 mg",
      "pharmaceutical": "Square Pharmaceuticals PLC.",
      "unit_price": 1.25
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 8,
    "total_pages": 1,
    "has_next_page": false,
    "has_previous_page": false
  }
}
```

The original drug itself is excluded from the alternatives.

---

## 5. Get Alternative Brands by Brand Name

Finds a drug using its brand name and returns other brands with the same generic name.

### Request

```http
GET /api/drugs/alternatives?brand_name=Napa&page=1&limit=20
```

### Query Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `brand_name` | String | Yes | Exact brand name to look up |
| `page` | Integer | No | Page number; default `1` |
| `limit` | Integer | No | Results per page; default `20`, maximum `100` |

The brand-name lookup is **case-insensitive**.

For example:

```http
GET /api/drugs/alternatives?brand_name=napa
```

and

```http
GET /api/drugs/alternatives?brand_name=NAPA
```

will find the same brand.

### Response

```json
{
  "drug": {
    "_id": "671234567890abcdef123456",
    "brand_name": "Napa",
    "generic_name": "Paracetamol",
    "dosage_type": "Tablet",
    "strength": "500 mg",
    "pharmaceutical": "Beximco Pharmaceuticals Ltd.",
    "unit_price": 1.2
  },
  "alternatives": [
    {
      "_id": "671234567890abcdef654321",
      "brand_name": "Ace",
      "generic_name": "Paracetamol",
      "dosage_type": "Tablet",
      "strength": "500 mg",
      "pharmaceutical": "Square Pharmaceuticals PLC.",
      "unit_price": 1.25
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 8,
    "total_pages": 1,
    "has_next_page": false,
    "has_previous_page": false
  }
}
```

---

## 6. Add a Single Drug

Creates a new drug document.

### Request

```http
POST /api/drugs
Content-Type: application/json
```

### Request Body

```json
{
  "brand_name": "Napa",
  "generic_name": "Paracetamol",
  "dosage_type": "Tablet",
  "strength": "500 mg",
  "pharmaceutical": "Beximco Pharmaceuticals Ltd.",
  "unit_price": 1.2
}
```

### Response

```json
{
  "_id": "671234567890abcdef123456",
  "brand_name": "Napa",
  "generic_name": "Paracetamol",
  "dosage_type": "Tablet",
  "strength": "500 mg",
  "pharmaceutical": "Beximco Pharmaceuticals Ltd.",
  "unit_price": 1.2,
  "createdAt": "2026-10-01T10:00:00.000Z",
  "updatedAt": "2026-10-01T10:00:00.000Z"
}
```

---

## 7. Bulk Insert Drugs

Creates multiple drug documents in a single API request.

### Request

```http
POST /api/drugs/bulk
Content-Type: application/json
```

### Request Body

The request body must be an array:

```json
[
  {
    "brand_name": "Napa",
    "generic_name": "Paracetamol",
    "dosage_type": "Tablet",
    "strength": "500 mg",
    "pharmaceutical": "Beximco Pharmaceuticals Ltd.",
    "unit_price": 1.2
  },
  {
    "brand_name": "Ace",
    "generic_name": "Paracetamol",
    "dosage_type": "Tablet",
    "strength": "500 mg",
    "pharmaceutical": "Square Pharmaceuticals PLC.",
    "unit_price": 1.25
  }
]
```

### Response

```json
{
  "message": "Drugs inserted successfully",
  "inserted": 2
}
```

The server inserts large datasets in batches of **500 records**.

The Express JSON request-body limit is configured to **10 MB**.

---

# Pagination

All endpoints that return lists support pagination.

### Parameters

```text
?page=1&limit=20
```

### Fields

| Field | Description |
|---|---|
| `page` | Current page |
| `limit` | Number of records requested |
| `total` | Total number of matching records |
| `total_pages` | Total number of available pages |
| `has_next_page` | Whether another page exists |
| `has_previous_page` | Whether a previous page exists |

### Example

For:

```text
total = 125
limit = 20
```

the API returns:

```json
{
  "page": 1,
  "limit": 20,
  "total": 125,
  "total_pages": 7,
  "has_next_page": true,
  "has_previous_page": false
}
```

---

# HTTP Status Codes

| Status Code | Meaning |
|---:|---|
| `200` | Request successful |
| `201` | Resource created successfully |
| `400` | Invalid request |
| `404` | Resource not found |
| `500` | Internal server error |

### Common Errors

#### Missing brand name

```json
{
  "message": "brand_name query parameter is required"
}
```

#### Invalid drug ID

```json
{
  "message": "Invalid drug ID"
}
```

#### Drug not found

```json
{
  "message": "Drug not found"
}
```

#### Empty bulk request

```json
{
  "message": "Request body must be a non-empty array"
}
```

---

# Implementation Notes

## MongoDB `_id`

MongoDB automatically generates an `_id` field for each drug.

This replaces the integer `id` used in the original SQL database.

Example:

```text
671234567890abcdef123456
```

---

## Alternative Drug Matching

The current alternative-brand implementation matches drugs using:

```text
generic_name
```

This means drugs with the same generic name but different strengths or dosage forms can potentially appear as alternatives.

For example:

```text
Paracetamol 500 mg Tablet
Paracetamol 650 mg Tablet
Paracetamol 120 mg/5 ml Syrup
```

could all be considered alternatives because they share the same generic name.

For more precise medicine equivalence, the matching criteria can instead use:

```text
generic_name + strength + dosage_type
```

---

## Indexes

The MongoDB schema includes indexes for commonly queried fields:

```js
drugSchema.index({ brand_name: 1 });

drugSchema.index({ generic_name: 1 });

drugSchema.index({
    generic_name: 1,
    strength: 1,
    dosage_type: 1
});
```

These indexes improve query performance for brand and generic-name lookups.

---

## Search Performance

The brand search endpoint currently uses a case-insensitive regular expression.

This is convenient for partial searches such as:

```text
napa
```

matching:

```text
Napa
Napa Extra
Napa Extend
```

For very large datasets, MongoDB Atlas Search or another dedicated text-search solution may provide better performance.

---

## Pagination Strategy

The current implementation uses:

```js
skip()
limit()
```

This is simple and works well for normal pagination.

For extremely large datasets and very high page numbers, cursor-based pagination can provide better performance.

---

## Bulk Insert Behavior

Bulk insertion is performed in batches of 500 records.

Example:

```text
10,000 records
        ↓
20 batches
        ↓
500 records per batch
```

The batches are inserted sequentially.

The current implementation is not a database transaction, so if a later batch fails, previously inserted batches may remain in the database.

---

## Authentication

Authentication and authorization are not currently implemented.