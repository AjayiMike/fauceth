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

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

-   [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
-   [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
