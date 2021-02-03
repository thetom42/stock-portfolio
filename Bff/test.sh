#!/bin/bash
cd $(dirname "$0")

source test-utils.sh node

# Remote - Containers does not auto-sync UID/GID for Docker Compose,
# so make sure test project prvs match the non-root user in the container.
fixTestProjectFolderPrivs

# Run common tests
checkCommon

# Definition specific tests
checkExtension "dbaeumer.vscode-eslint"
check "node" node --version
check "yarn" yarn install
check "npm" npm install
check "eslint" eslint server.js
check "test-project" npm run test
check "nvm" bash -c ". /usr/local/share/nvm/nvm.sh && nvm install 8"
check "nvm-node" bash -c ". /usr/local/share/nvm/nvm.sh && node --version"
sudo rm -rf node_modules

# Report result
reportResults
