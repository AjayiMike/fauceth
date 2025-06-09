<div align="center">
  <img src="https://raw.githubusercontent.com/AjayiMike/fauceth/67f58099e14b7d7984606a5dd8b65d882f1dca40/public/fauceth.svg" alt="FaucETH Logo" width="150">
  <h1>FaucETH</h1>
  <p>A community-funded and reliable Ethereum testnet faucet.</p>

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

</div>

---

FaucETH is a high-performance, community-funded faucet for Ethereum testnets. It's designed to provide developers with a fast and reliable source of testnet ETH for their dApps, smart contracts, and other blockchain projects. Our goal is to create a community-driven resource that is easy to use, easy to contribute to, and supports a wide range of EVM-compatible test networks.

### ✨ Key Features

-   **Multi-Network Support:** Get testnet funds on 400+ test networks and counting.
-   **Progressive Network Discovery:** The UI loads instantly and validates network health in the background, so you're never left waiting.
-   **IP and wallet address Rate Limiting:** Request funds from up to 3 different networks within a 24-hour period.
-   **Anti-sybil protection** Requires a resonable number of gitcoin passport score or a minimum of 2ETH donation to protect against bots
-   **Community Funded:** Anyone can donate to the faucet to help other developers.
-   **Real-time Updates:** See donation leaderboard, recent transactions and faucet statistics update live.
-   **Automatically Extensible:** Add your testnet to [ethereum-lists/chains](https://github.com/ethereum-lists/chains) and see it show up in FaucETH network list instantly

### 🛠️ Tech Stack

-   **Framework:** [Next.js](https://nextjs.org/) (App Router)
-   **Language:** [TypeScript](https://www.typescriptlang.org/)
-   **Database:** [MongoDB](https://www.mongodb.com/)
-   **ODM:** [Mongoose](https://mongoosejs.com/)
-   **State Management:** [Zustand](https://zustand-demo.pmnd.rs/)
-   **UI:** [Tailwind CSS](https://tailwindcss.com/) & [shadcn/ui](https://ui.shadcn.com/)
-   **Blockchain Interaction:** [viem](https://viem.sh/)

### 🚀 Getting Started

Follow these steps to set up FaucETH on your local machine.

#### 1. Prerequisites

-   [Node.js](https://nodejs.org/en/) (v18 or newer)
-   [pnpm](https://pnpm.io/installation)
-   [MongoDB](https://www.mongodb.com/try/download/community)

#### 2. Clone the Repository

```bash
git clone https://github.com/your-username/fauceth.git
cd fauceth
```

#### 3. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Now, open the `.env` file and configure it with your own values

#### 4. Install Dependencies

Install the necessary packages.

```bash
pnpm install
```

#### 5. MongoDB Setup

##### macOS/Linux

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

    To stop MongoDB:

    ```bash
    pkill -f "mongod.*rs0"
    ```

##### Windows

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

    To stop MongoDB:

    ```cmd
    taskkill /F /IM mongod.exe
    ```

#### 5. Run the Development Server

You're all set! Start the app by running:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the running application.

### 🙌 Contributing

We welcome contributions of all kinds! Whether you're a developer, a designer, or just have an idea for a new feature, we'd love to have your input. Please check out our [Contributing Guide](CONTRIBUTING.md) to get started.

### 📄 License

FaucETH is open-source software licensed under the [MIT License](LICENSE).
