# User and Transactions Relationship Visualization System

A full-stack application for visualizing relationships between users and transactions using a graph database (Neo4j).

## Tech Stack

- **Frontend**: React + Vite + Tailwind CSS + Cytoscape.js (for graph visualization)
- **Backend**: Node.js + Express.js
- **Database**: Neo4j (graph database)
- **Containerization**: Docker + Docker Compose

## Project Overview

This project provides a visualization system to identify relationships between users and transactions. It helps in detecting patterns and connections that might be indicators of fraud or suspicious activities.

Features:

- Search and filter users by name, email, and phone
- Search and filter transactions by amount range, IP address, and device ID
- Visualize connections between users and transactions as an interactive graph
- Display different types of relationships with color coding
- Containerized deployment with Docker Compose

## Getting Started

### Prerequisites

- Docker and Docker Compose installed on your system
- Git for cloning the repository

### Installation & Running

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd user-transaction-graph
   ```

2. Start the application:

   ```bash
   docker-compose up --build
   ```

3. Access the application:
   - Frontend: [http://localhost:3000](http://localhost:3000)
   - Backend API: [http://localhost:3001](http://localhost:3001)
   - Neo4j Browser: [http://localhost:7474](http://localhost:7474)
     - Neo4j credentials: neo4j / password

## Generating Sample Data

The system comes with a data generation script that can create both a small test dataset and a large dataset with 10,000+ users and 100,000+ transactions.

Run the data generation script:

```bash
docker-compose exec backend npm run generate-data
```

By default the script generates ~250 users and 1,000 transactions. You can override the size with environment variables:

```bash
# Example: create 5,000 users and 100,000 transactions with larger batch writes
docker-compose exec backend \
  bash -lc "USER_COUNT=5000 TRANSACTION_COUNT=100000 BATCH_SIZE=2000 npm run generate-data"
```

> **Note:** For large runs the script may bump `USER_COUNT` automatically to honor the per-user limits—check the console output for any warnings.

What the script does on each run:

1. Clears existing nodes and relationships in the connected Neo4j database.
2. Generates faker-based users with a mix of shared attributes to mimic fraud rings.
3. Generates the requested number of transactions with shared IP/device patterns.
4. Writes everything to Neo4j in batches (default 1,000 records at a time).

Performance tips for large datasets (50k+ transactions):

- Increase `BATCH_SIZE` (e.g., 2000–5000) if the database has enough memory.
- Run against a Neo4j Aura instance or a local instance with at least 4 GB RAM.
- Expect the 100k transaction run to take several minutes; keep the terminal attached until you see "✅ Database seeded successfully".

## API Documentation

### User Endpoints

#### `GET /users`

Get paginated list of users with optional filtering.

**Query Parameters:**

- `page` (number, default: 1): Page number
- `limit` (number, default: 10): Items per page
- `name` (string, optional): Filter by name (case-insensitive)
- `email` (string, optional): Filter by email (case-insensitive)
- `phone` (string, optional): Filter by phone number (case-insensitive)

**Response:**

```json
{
  "data": [
    {
      "id": "U1234567890",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "1234567890",
      "address": "123 Main St",
      "paymentMethod": "Visa 4242********4242"
    }
    // ...more users
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "totalItems": 42,
    "totalPages": 5
  }
}
```

#### `POST /users`

Create or update a user and automatically detect shared attributes.

**Request Body:**

```json
{
  "id": "U1234567890",
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "1234567890",
  "address": "123 Main St",
  "paymentMethod": "Visa 4242********4242"
}
```

**Response:**

```json
{
  "user": {
    "id": "U1234567890",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "1234567890",
    "address": "123 Main St",
    "paymentMethod": "Visa 4242********4242"
  },
  "message": "User created or updated successfully"
}
```

#### `GET /users/:id`

Get a specific user by ID.

**Response:**

```json
{
  "id": "U1234567890",
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "1234567890",
  "address": "123 Main St",
  "paymentMethod": "Visa 4242********4242"
}
```

### Transaction Endpoints

#### `GET /transactions`

Get paginated list of transactions with optional filtering.

**Query Parameters:**

- `page` (number, default: 1): Page number
- `limit` (number, default: 10): Items per page
- `minAmount` (number, optional): Minimum transaction amount
- `maxAmount` (number, optional): Maximum transaction amount
- `ip` (string, optional): Filter by IP address
- `deviceId` (string, optional): Filter by device ID

**Response:**

```json
{
  "data": [
    {
      "id": "T1234567890",
      "amount": 100.5,
      "timestamp": 1632512400000,
      "ip": "192.168.1.1",
      "deviceId": "device123",
      "senderId": "U1111111111",
      "receiverId": "U2222222222"
    }
    // ...more transactions
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "totalItems": 120,
    "totalPages": 12
  }
}
```

#### `POST /transactions`

Create a new transaction.

**Request Body:**

```json
{
  "id": "T1234567890",
  "amount": 100.5,
  "timestamp": 1632512400000,
  "ip": "192.168.1.1",
  "deviceId": "device123",
  "senderId": "U1111111111",
  "receiverId": "U2222222222"
}
```

**Response:**

```json
{
  "transaction": {
    "id": "T1234567890",
    "amount": 100.5,
    "timestamp": 1632512400000,
    "ip": "192.168.1.1",
    "deviceId": "device123",
    "senderId": "U1111111111",
    "receiverId": "U2222222222"
  },
  "message": "Transaction created successfully"
}
```

#### `GET /transactions/:id`

Get a specific transaction by ID.

**Response:**

```json
{
  "id": "T1234567890",
  "amount": 100.5,
  "timestamp": 1632512400000,
  "ip": "192.168.1.1",
  "deviceId": "device123",
  "senderId": "U1111111111",
  "receiverId": "U2222222222"
}
```

### Relationship Endpoints

#### `GET /relationships/user/:id`

Get all connected users and transactions for a given user.

**Response:**

```json
{
  "nodes": [
    {
      "id": "U1234567890",
      "label": "John Doe",
      "type": "user",
      "data": {
        "id": "U1234567890",
        "name": "John Doe",
        "email": "john@example.com",
        "phone": "1234567890",
        "address": "123 Main St",
        "paymentMethod": "Visa 4242********4242"
      }
    }
    // ...more nodes (users and transactions)
  ],
  "edges": [
    {
      "source": "U1234567890",
      "target": "T1234567890",
      "label": "SENT",
      "type": "sent"
    }
    // ...more edges
  ]
}
```

#### `GET /relationships/transaction/:id`

Get all linked users and transactions for a given transaction.

**Response:**

```json
{
  "nodes": [
    {
      "id": "T1234567890",
      "label": "$100.50",
      "type": "transaction",
      "data": {
        "id": "T1234567890",
        "amount": 100.5,
        "timestamp": 1632512400000,
        "ip": "192.168.1.1",
        "deviceId": "device123",
        "senderId": "U1111111111",
        "receiverId": "U2222222222"
      }
    }
    // ...more nodes (users and transactions)
  ],
  "edges": [
    {
      "source": "U1111111111",
      "target": "T1234567890",
      "label": "SENT",
      "type": "sent"
    }
    // ...more edges
  ]
}
```

## Database Schema

### Nodes

- `:User` — properties: `id`, `name`, `email`, `phone`, `address`, `paymentMethod`
- `:Transaction` — properties: `id`, `amount`, `timestamp`, `ip`, `deviceId`, `senderId`, `receiverId`

### Relationships

- `(u1:User)-[:SENT]->(t:Transaction)` — User sent a transaction
- `(t:Transaction)-[:RECEIVED]->(u2:User)` — Transaction received by user
- `(u1)-[:SHARED_EMAIL]->(u2)` — Users share an email address
- `(u1)-[:SHARED_PHONE]->(u2)` — Users share a phone number
- `(u1)-[:SHARED_ADDRESS]->(u2)` — Users share an address
- `(u1)-[:SHARED_PAYMENT_METHOD]->(u2)` — Users share a payment method
- `(t1:Transaction)-[:SHARED_IP]->(t2)` — Transactions share an IP address
- `(t1)-[:SHARED_DEVICE]->(t2)` — Transactions share a device ID

## Development

### Project Structure

```
user-transaction-graph/
├── backend/
│   ├── src/
│   │   ├── controllers/       # Request handlers
│   │   ├── routes/            # API routes
│   │   ├── services/          # Business logic
│   │   ├── utils/             # Utility functions
│   │   └── app.js            # Express application
│   ├── data/
│   │   └── generateData.js    # Data generation script
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/        # Reusable components
│   │   ├── pages/             # Page components
│   │   ├── services/          # API service calls
│   │   └── App.jsx, main.jsx
│   ├── index.html
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── vite.config.js
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml
└── README.md
```

## Troubleshooting

### Neo4j Connection Issues

- Ensure Neo4j container is running: `docker-compose ps`
- Check Neo4j logs: `docker-compose logs neo4j`
- Verify connection settings in backend `.env` file

### Backend API Issues

- Check backend logs: `docker-compose logs backend`
- Verify Neo4j connection in backend

### Frontend Issues

- Check frontend logs: `docker-compose logs frontend`
- Verify API endpoint configuration in frontend services

## License

This project is licensed under the MIT License - see the LICENSE file for details.
