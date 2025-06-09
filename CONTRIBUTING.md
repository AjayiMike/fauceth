# Contributing to FaucETH

First off, thank you for considering contributing to FaucETH! It's people like you that make FaucETH such a great project.

## Contribution Workflow

Here's a summary of the workflow for contributors:

1.  **Fork and Clone**: Fork the repository on GitHub, then clone your fork locally.
2.  **Configure Upstream**: Add the original FaucETH repository as an `upstream` remote. This helps you keep your fork in sync.
3.  **Create a Branch**: Create a new branch for your feature or bugfix.
4.  **Develop**: Make your code changes.
5.  **Commit**: Commit your changes with a clear message.
6.  **Sync and Rebase**: Before pushing, sync your `main` branch with the upstream repository and rebase your feature branch on top of the latest changes.
7.  **Push**: Push your branch to your fork on GitHub.
8.  **Open a Pull Request**: Create a Pull Request from your branch to the `main` branch of the original FaucETH repository.

## Detailed Steps

### 1. Fork and Clone the Repository

First, [fork FaucETH](https://github.com/ajayimike/fauceth/fork) on GitHub.

Then, clone your fork to your local machine:

```sh
git clone git@github.com:YOUR_USERNAME/fauceth.git
cd fauceth
```

### 2. Configure Upstream Remote

Add the original repository as an `upstream` remote. This is a one-time setup.

```sh
git remote add upstream https://github.com/ajayimike/fauceth.git
```

You can verify that the remote was added by running:

```sh
git remote -v
```

This will show you two remotes:

- `origin` points to **your personal fork** of the repository on GitHub.
- `upstream` points to the **original `ajayimike/fauceth` repository**.

You will push your changes to `origin` and pull updates from `upstream`.

### 3. Create a Branch

Before you start coding, create a new branch based on the `main` branch. Use a descriptive name. If you are working on an issue, include the issue number.

```sh
# Make sure you are on the main branch and it's up to date
git checkout main
git pull upstream main

# Create your new branch (e.g. for issue #38)
git checkout -b feat/38/add-awesome-feature
```

### 4. Get the project running

The `README.md` has instructions on how to get the project running. At this point, you're ready to make your changes! Feel free to ask for help; everyone is a beginner at first 😸

### 5. Code Formatting

This project uses [Prettier](https://prettier.io/) to enforce a consistent code style. You don't need to run any commands manually. Your code will be automatically formatted for you before each commit thanks to a pre-commit hook.

If you use VS Code, we highly recommend installing the [Prettier extension](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode). The project is already configured to use it to format your code automatically every time you save a file.

### 6. Commit Your Changes

Once you're happy with your changes, stage and commit them.

```sh
git add .
git commit -m "feat: add awesome feature"
```

Please write a clear and concise commit message.

### 7. Sync and Rebase

Before you push your changes, it's important to sync your branch with the latest changes from the main project. This is especially important if you have a long-running branch.

```sh
# Switch to your main branch and pull the latest changes
git checkout main
git pull upstream main

# Switch back to your feature branch
git checkout feat/38/add-awesome-feature

# Rebase your branch onto the latest main
# This applies your commits on top of the latest changes
git rebase main
```

You may need to resolve merge conflicts during the rebase.

### 8. Push to Your Fork

Push your rebased branch to your fork on GitHub.

```sh
# You may need to force push because of the rebase
git push origin feat/38/add-awesome-feature --force-with-lease
```

**A Note on Force Pushing:** We use `git rebase` to keep the commit history clean. Rebasing rewrites your branch's history, so you must use a force push to update the branch on your fork.

We specifically recommend `--force-with-lease` because it is safer than a standard `--force`. It will not overwrite any work on the remote branch if someone else has pushed to it since you last fetched, thereby preventing accidental data loss.

### 9. Open a Pull Request

Go to your fork on GitHub. You should see a prompt to create a pull request from your new branch. Follow the link, fill out the pull request template, and submit it.

That's it! Thank you for your contribution.

---

Thanks!
