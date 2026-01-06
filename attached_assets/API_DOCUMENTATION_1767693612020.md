# Loretta Diabetes Prediction API Documentation

**Version:** 1.0.0  
**Base URL:** `https://loretta-ml-analytics-dev-5oc2gjs2kq-el.a.run.app` (Production)  
**Local Development:** `http://localhost:8080`

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Authentication](#authentication)
3. [Endpoints](#endpoints)
   - [Root Endpoint](#1-root-endpoint)
   - [Health Check](#2-health-check)
   - [Get Questionnaire](#3-get-questionnaire)
   - [Predict Diabetes](#4-predict-diabetes)
4. [Request/Response Formats](#requestresponse-formats)
5. [Feature Value Formats](#feature-value-formats)
6. [Error Handling](#error-handling)
7. [Examples](#examples)
8. [Interactive Documentation](#interactive-documentation)

---

## Quick Start

### 1. Check API Health

```bash
curl https://loretta-ml-analytics-dev-5oc2gjs2kq-el.a.run.app/health
```

### 2. Get Available Features

```bash
curl https://loretta-ml-analytics-dev-5oc2gjs2kq-el.a.run.app/questionnaire
```

### 3. Make a Prediction

```bash
curl -X POST https://loretta-ml-analytics-dev-5oc2gjs2kq-el.a.run.app/predict \
  -H "Content-Type: application/json" \
  -d '{
    "features": [
      {"ID": "RIDAGEYR", "Value": "57"},
      {"ID": "BPQ020", "Value": "No"},
      {"ID": "DIQ180", "Value": "0.0"},
      {"ID": "HUQ010", "Value": "Very good"},
      {"ID": "WHD020", "Value": "125.0"}
    ]
  }'
```

---

## Authentication

Currently, the API does not require authentication. All endpoints are publicly accessible.

---

## Endpoints

### 1. Root Endpoint

Get basic information about the API and available endpoints.

**Endpoint:** `GET /`

**Request:**

```bash
curl https://loretta-ml-analytics-dev-5oc2gjs2kq-el.a.run.app/
```

**Response:**

```json
{
  "name": "Loretta Diabetes Prediction API",
  "version": "1.0.0",
  "description": "Predicts diabetes probability from NHANES health survey features",
  "endpoints": {
    "health": {
      "path": "/health",
      "method": "GET",
      "description": "Health check endpoint to verify service status"
    },
    "questionnaire": {
      "path": "/questionnaire",
      "method": "GET",
      "description": "Get list of all expected features with descriptions and valid values"
    },
    "predict": {
      "path": "/predict",
      "method": "POST",
      "description": "Predict diabetes probability from feature inputs"
    },
    "docs": {
      "path": "/docs",
      "method": "GET",
      "description": "Interactive API documentation (Swagger UI)"
    },
    "redoc": {
      "path": "/redoc",
      "method": "GET",
      "description": "Alternative API documentation (ReDoc)"
    }
  }
}
```

---

### 2. Health Check

Check if the API service is running and the model is loaded.

**Endpoint:** `GET /health`

**Request:**

```bash
curl https://loretta-ml-analytics-dev-5oc2gjs2kq-el.a.run.app/health
```

**Response:**

```json
{
  "status": "healthy",
  "model_loaded": true,
  "message": "Service is operational"
}
```

**Response Fields:**

- `status` (string): Service status (`"healthy"` or `"unhealthy"`)
- `model_loaded` (boolean): Whether the ML model is loaded and ready
- `message` (string, optional): Additional status message

**Status Codes:**

- `200 OK`: Service is operational

---

### 3. Get Questionnaire

Retrieve the complete list of all features expected by the model, including their descriptions, value types, and valid value descriptions.

**Endpoint:** `GET /questionnaire`

**Request:**

```bash
curl https://loretta-ml-analytics-dev-5oc2gjs2kq-el.a.run.app/questionnaire
```

**Response:**

```json
{
  "questions": [
    {
      "ID": "RIDAGEYR",
      "Description": "Age in years at screening",
      "Value type": "Numerical",
      "Value description": {}
    },
    {
      "ID": "BPQ020",
      "Description": "Ever told you had high blood pressure",
      "Value type": "Categorical",
      "Value description": {
        "0.0": "No",
        "1.0": "Yes"
      }
    },
    {
      "ID": "HUQ010",
      "Description": "General health condition",
      "Value type": "Categorical",
      "Value description": {
        "0.0": "Excellent",
        "1.0": "Very good",
        "2.0": "Good",
        "3.0": "Fair",
        "4.0": "Poor"
      }
    }
  ],
  "total_questions": 50
}
```

**Response Fields:**

- `questions` (array): List of feature information objects
  - `ID` (string): Feature identifier (use this in prediction requests)
  - `Description` (string): Human-readable description of the feature
  - `Value type` (string): Either `"Numerical"` or `"Categorical"`
  - `Value description` (object): For categorical features, maps numeric values to human-readable descriptions
- `total_questions` (integer): Total number of features expected by the model

**Status Codes:**

- `200 OK`: Questionnaire retrieved successfully
- `503 Service Unavailable`: Questionnaire info not loaded

**Use Cases:**

- Build dynamic forms based on expected features
- Understand valid values for categorical features
- Validate feature IDs before making predictions

---

### 4. Predict Diabetes

Predict the probability of diabetes for a given set of health features.

**Endpoint:** `POST /predict`

**Request Headers:**

```
Content-Type: application/json
```

**Request Body:**

```json
{
  "features": [
    {
      "ID": "RIDAGEYR",
      "Value": "57"
    },
    {
      "ID": "BPQ020",
      "Value": "No"
    },
    {
      "ID": "DIQ180",
      "Value": "0.0"
    },
    {
      "ID": "HUQ010",
      "Value": "Very good"
    },
    {
      "ID": "WHD020",
      "Value": "125.0"
    }
  ]
}
```

**Request Fields:**

- `features` (array, required): Array of feature input objects
  - `ID` (string, required): Feature identifier (must match IDs from `/questionnaire`)
  - `Value` (string, required): Feature value as a string. Can be:
    - Numeric string: `"57"`, `"125.0"`, `"-0.2588"`
    - Human-readable description: `"No"`, `"Yes"`, `"Very good"`, `"Mexican American"` (case-insensitive)
    - Empty string `""`: Treated as null and will be imputed

**Important Notes:**

- You don't need to include all 50 features in the request
- Missing features will be automatically set to `null` and imputed using training data statistics
- Empty strings are treated as `null` and will be imputed
- For categorical features, you can use either numeric strings or human-readable descriptions
- Case-insensitive matching is supported for categorical descriptions

**Response:**

```json
{
  "diabetes_probability": 0.234,
  "risk_level": "Low"
}
```

**Response Fields:**

- `diabetes_probability` (float): Probability of having diabetes (0.0 to 1.0)
- `risk_level` (string): Risk categorization based on probability:
  - `"Low"`: probability < 0.4
  - `"Medium"`: 0.4 ≤ probability < 0.7
  - `"High"`: probability ≥ 0.7

**Status Codes:**

- `200 OK`: Prediction completed successfully
- `400 Bad Request`: Invalid feature ID or value format
- `503 Service Unavailable`: Model not loaded or service unavailable
- `500 Internal Server Error`: Error during prediction processing

**Error Responses:**

**Invalid Feature ID:**

```json
{
  "detail": "Invalid feature ID: 'INVALID_ID'. Feature not found in expected features."
}
```

**Invalid Feature Value:**

```json
{
  "detail": "Invalid value 'InvalidValue' for feature 'BPQ020'. Value must be numeric or a valid description."
}
```

---

## Request/Response Formats

### Request Format

The API uses a **new array-based format** for feature inputs:

```json
{
  "features": [
    { "ID": "FEATURE_ID_1", "Value": "value1" },
    { "ID": "FEATURE_ID_2", "Value": "value2" }
  ]
}
```

**Why Array Format?**

- More flexible: you can include only the features you have
- Easier to iterate programmatically
- Supports both numeric and human-readable values
- Missing features are automatically handled

### Response Format

All successful responses return JSON objects with consistent structure. Error responses include a `detail` field with error information.

---

## Feature Value Formats

### Numerical Features

For numerical features (e.g., `RIDAGEYR`, `WHD020`, `INDFMPIR`), provide numeric values as strings:

```json
{"ID": "RIDAGEYR", "Value": "57"}
{"ID": "WHD020", "Value": "125.0"}
{"ID": "INDFMPIR", "Value": "3.02"}
{"ID": "SLQ310_cos", "Value": "-0.2588"}
```

### Categorical Features

For categorical features, you can use either:

**Option 1: Numeric String** (as used in training data)

```json
{"ID": "BPQ020", "Value": "0.0"}  // No
{"ID": "BPQ020", "Value": "1.0"}  // Yes
{"ID": "HUQ010", "Value": "1.0"}  // Very good
```

**Option 2: Human-Readable Description** (case-insensitive)

```json
{"ID": "BPQ020", "Value": "No"}
{"ID": "BPQ020", "Value": "yes"}  // Case-insensitive
{"ID": "HUQ010", "Value": "Very good"}
{"ID": "RIDRETH3", "Value": "Non-Hispanic White"}
```

**To find valid descriptions for a feature:**

1. Call `GET /questionnaire`
2. Find the feature by `ID`
3. Check the `Value description` field for valid options

### Missing Values

Missing values can be handled in three ways:

1. **Omit the feature** from the request (recommended)
2. **Use empty string**: `{"ID": "FEATURE_ID", "Value": ""}`
3. **Use null** (if your JSON parser supports it): `{"ID": "FEATURE_ID", "Value": null}`

All missing values will be automatically imputed using the same imputation logic used during model training.

---

## Error Handling

### HTTP Status Codes

| Code | Meaning               | Description                                  |
| ---- | --------------------- | -------------------------------------------- |
| 200  | OK                    | Request successful                           |
| 400  | Bad Request           | Invalid request format, feature ID, or value |
| 500  | Internal Server Error | Server-side error during processing          |
| 503  | Service Unavailable   | Model not loaded or service not ready        |

### Error Response Format

All error responses follow this format:

```json
{
  "detail": "Error message describing what went wrong"
}
```

### Common Errors

**1. Invalid Feature ID**

```json
{
  "detail": "Invalid feature ID: 'INVALID_ID'. Feature not found in expected features."
}
```

**Solution:** Use `GET /questionnaire` to get the list of valid feature IDs.

**2. Invalid Feature Value**

```json
{
  "detail": "Invalid value 'InvalidValue' for feature 'BPQ020'. Value must be numeric or a valid description."
}
```

**Solution:**

- For numerical features, provide a numeric string
- For categorical features, use either a numeric string or a valid human-readable description from the questionnaire

**3. Model Not Loaded**

```json
{
  "detail": "Model not loaded. Service is unavailable."
}
```

**Solution:** Check the `/health` endpoint. If the model is not loaded, the service may be starting up or there may be a deployment issue.

---

## Examples

### Example 1: Minimal Prediction (Key Features Only)

```bash
curl -X POST https://loretta-ml-analytics-dev-5oc2gjs2kq-el.a.run.app/predict \
  -H "Content-Type: application/json" \
  -d '{
    "features": [
      {"ID": "RIDAGEYR", "Value": "57"},
      {"ID": "BPQ020", "Value": "No"},
      {"ID": "DIQ180", "Value": "0.0"},
      {"ID": "DIQ160", "Value": "Yes"},
      {"ID": "BPQ080", "Value": "1.0"},
      {"ID": "HUQ010", "Value": "Very good"},
      {"ID": "WHD020", "Value": "125.0"},
      {"ID": "WHD010", "Value": "64.0"}
    ]
  }'
```

**Response:**

```json
{
  "diabetes_probability": 0.234,
  "risk_level": "Low"
}
```

### Example 2: Using Human-Readable Values

```bash
curl -X POST https://loretta-ml-analytics-dev-5oc2gjs2kq-el.a.run.app/predict \
  -H "Content-Type: application/json" \
  -d '{
    "features": [
      {"ID": "RIDAGEYR", "Value": "57"},
      {"ID": "BPQ020", "Value": "No"},
      {"ID": "RIDRETH3", "Value": "Non-Hispanic White"},
      {"ID": "DMDEDUC2", "Value": "High school graduate/GED or equivalent"},
      {"ID": "INDFMPIR", "Value": "3.02"},
      {"ID": "HUQ010", "Value": "Very good"}
    ]
  }'
```

### Example 3: Using JSON File

Create a file `request.json`:

```json
{
  "features": [
    { "ID": "RIDAGEYR", "Value": "57" },
    { "ID": "BPQ020", "Value": "No" },
    { "ID": "DIQ180", "Value": "0.0" },
    { "ID": "HUQ010", "Value": "Very good" },
    { "ID": "WHD020", "Value": "125.0" }
  ]
}
```

Then make the request:

```bash
curl -X POST https://loretta-ml-analytics-dev-5oc2gjs2kq-el.a.run.app/predict \
  -H "Content-Type: application/json" \
  -d @request.json
```

### Example 4: Python Request

```python
import requests

url = "https://loretta-ml-analytics-dev-5oc2gjs2kq-el.a.run.app/predict"

payload = {
    "features": [
        {"ID": "RIDAGEYR", "Value": "57"},
        {"ID": "BPQ020", "Value": "No"},
        {"ID": "DIQ180", "Value": "0.0"},
        {"ID": "HUQ010", "Value": "Very good"},
        {"ID": "WHD020", "Value": "125.0"}
    ]
}

response = requests.post(url, json=payload)
result = response.json()

print(f"Diabetes Probability: {result['diabetes_probability']:.2%}")
print(f"Risk Level: {result['risk_level']}")
```

### Example 5: JavaScript/Node.js Request

```javascript
const fetch = require("node-fetch");

const url = "https://loretta-ml-analytics-dev-5oc2gjs2kq-el.a.run.app/predict";

const payload = {
  features: [
    { ID: "RIDAGEYR", Value: "57" },
    { ID: "BPQ020", Value: "No" },
    { ID: "DIQ180", Value: "0.0" },
    { ID: "HUQ010", Value: "Very good" },
    { ID: "WHD020", Value: "125.0" },
  ],
};

fetch(url, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(payload),
})
  .then((res) => res.json())
  .then((data) => {
    console.log(
      `Diabetes Probability: ${(data.diabetes_probability * 100).toFixed(2)}%`
    );
    console.log(`Risk Level: ${data.risk_level}`);
  });
```

---

## Interactive Documentation

The API provides interactive documentation powered by FastAPI:

### Swagger UI

Visit: `https://loretta-ml-analytics-dev-5oc2gjs2kq-el.a.run.app/docs`

- Interactive API explorer
- Try out endpoints directly in the browser
- View request/response schemas
- See example requests

### ReDoc

Visit: `https://loretta-ml-analytics-dev-5oc2gjs2kq-el.a.run.app/redoc`

- Clean, readable API documentation
- Better for printing or sharing
- Organized endpoint documentation

---

## Common Feature IDs

Here are some commonly used feature IDs for quick reference:

| Feature ID | Description                              | Type                                             |
| ---------- | ---------------------------------------- | ------------------------------------------------ |
| `RIDAGEYR` | Age in years at screening                | Numerical                                        |
| `BPQ020`   | Ever told you had high blood pressure    | Categorical (No/Yes)                             |
| `DIQ180`   | Had blood tested past three years        | Categorical (No/Yes)                             |
| `DIQ160`   | Ever told you have prediabetes           | Categorical (No/Yes)                             |
| `BPQ080`   | Doctor told you - high cholesterol level | Categorical (No/Yes)                             |
| `HUQ010`   | General health condition                 | Categorical (Excellent/Very good/Good/Fair/Poor) |
| `WHD020`   | Current self-reported weight (pounds)    | Numerical                                        |
| `WHD010`   | Current self-reported height (inches)    | Numerical                                        |
| `RIDRETH3` | Race/Hispanic origin                     | Categorical                                      |
| `DMDEDUC2` | Education level                          | Categorical                                      |
| `INDFMPIR` | Family poverty income ratio              | Numerical                                        |

For a complete list with descriptions, call `GET /questionnaire`.

---

## Best Practices

1. **Always check `/health` first** before making predictions
2. **Use `/questionnaire`** to get valid feature IDs and value descriptions
3. **Include only known features** - missing features will be automatically imputed
4. **Use human-readable values** for categorical features when possible (easier to read and maintain)
5. **Handle errors gracefully** - check response status codes and error messages
6. **Cache questionnaire data** - it doesn't change frequently, so you can cache it client-side

---

## Support

For issues, questions, or feature requests, please contact the development team or refer to the project repository.

---

## Changelog

### Version 1.0.0

- Initial API release
- Support for array-based feature input format
- Support for human-readable categorical values
- Automatic imputation of missing features
- Interactive API documentation (Swagger UI and ReDoc)
