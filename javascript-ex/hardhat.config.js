require('@nomicfoundation/hardhat-toolbox');
require('dotenv').config({ path: __dirname + '/.env' });

// Constants
const FRONTRUNNING_MINING_INTERVAL = 10000; // 10 seconds
const MAINNET_FORK_BLOCK_NUMBER = 15969633;

const COMPILERS = [
  {
    version: '0.8.24',
  },
];

let scriptName;

if (process.argv[3] != undefined) {
  scriptName = process.argv[3];
} else {
  scriptName = ""
}

if (
  scriptName.includes('optimizer-vault-2')
) {
  console.log(`Forking Mainnet Block Height ${MAINNET_FORK_BLOCK_NUMBER}`);
  module.exports = {
    networks: {
      hardhat: {
        forking: {
          url: process.env.MAINNET,
          blockNumber: MAINNET_FORK_BLOCK_NUMBER,
        },
      },
    },
    solidity: {
      compilers: COMPILERS,
    },
  };
} else if (
  scriptName.includes('optimizer-vault-1')
) {
  // Frontrunning exercises are with "hardhat node mode", mining interval is 10 seconds
  console.log(`Forking Mainnet Block Height ${MAINNET_FORK_BLOCK_NUMBER}, Manual Mining Mode with interval of 10 seconds`);
  module.exports = {
    networks: {
      hardhat: {
        mining: {
          auto: false,
          interval: FRONTRUNNING_MINING_INTERVAL,
        },
        forking: {
          url: process.env.MAINNET,
          blockNumber: MAINNET_FORK_BLOCK_NUMBER,
        }
      },
    },
    solidity: {
      compilers: COMPILERS,
    },
  };
}
else {
  module.exports = {
    networks: {
      hardhat: {
        // loggingEnabled: true
      },
      goerli: {
        url: process.env.GOERLI
      }
    },
    solidity: {
      compilers: COMPILERS,
    },
  };
}