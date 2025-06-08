This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

# Test ETH Faucet

A community-funded testnet ETH faucet for all EVM chains where developers can donate and request test ETH for testing and development.

## Prerequisites

-   Node.js 18+
-   pnpm
-   MongoDB 6.0+

## Development Setup

### MongoDB Setup

#### macOS/Linux

1. Clean Up (If Needed)

    If you have an existing MongoDB instance running:

    ```bash
    # Stop any running MongoDB instances
    pkill mongod

    # Wait for processes to stop
    sleep 2
    ```

2. Create MongoDB data directory:

    ```bash
    mkdir -p ~/mongodb/data/rs0
    ```

3. Start MongoDB with replica set:

    ```bash
    mongod --replSet rs0 --port 27017 --dbpath ~/mongodb/data/rs0 --fork --logpath ~/mongodb/data/rs0/mongodb.log
    ```

4. Initialize replica set:

    ```bash
    mongosh --eval 'rs.initiate({_id: "rs0", members: [{_id: 0, host: "localhost:27017"}]})'
    ```

5. To stop MongoDB:
    ```bash
    pkill -f "mongod.*rs0"
    ```

#### Windows

1. Create MongoDB data directory:

    ```cmd
    mkdir "%USERPROFILE%\mongodb\data\rs0"
    ```

2. Start MongoDB with replica set:

    ```cmd
    start /B mongod --replSet rs0 --port 27017 --dbpath "%USERPROFILE%\mongodb\data\rs0" --logpath "%USERPROFILE%\mongodb\data\rs0\mongodb.log"
    ```

3. Initialize replica set:

    ```cmd
    mongosh --eval "rs.initiate({_id: 'rs0', members: [{_id: 0, host: 'localhost:27017'}]})"
    ```

4. To stop MongoDB:
    ```cmd
    taskkill /F /IM mongod.exe
    ```

### Application Setup

1. Install dependencies:

    ```bash
    pnpm install
    ```

2. Copy `.env.example` to `.env` and fill in the required values:

    ```bash
    cp .env.example .env
    ```

3. Start the development server:
    ```bash
    pnpm dev
    ```

## Production Deployment

For production, we recommend using MongoDB Atlas which provides managed replica sets out of the box. Simply update the `MONGODB_URI` in your environment variables to point to your Atlas cluster.

## License

MIT
