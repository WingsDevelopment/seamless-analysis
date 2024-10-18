const dataArray = require("./morpho-data.json");

const cbBTC_WETH =
  "0x5dffffc7d75dc5abfa8dbe6fad9cbdadf6680cbe1428bafe661497520c84a94c";
const cbBTC_USDC =
  "0x9103c3b4e834476c9a62ea009ba2c884ee42e94e6e314a26f04d312434191836";
const WETH_USDC =
  "0x8793cf302b8ffd655ab97bd1c695dbd967807e8367a65cb2f4edaf1380ba1bda";
const USDC_WETH =
  "0x3b3769cfca57be2eaed03fcc5299c25691b77781a1e124e7a8d520eb9a7eabb5";
const AERO_USDC =
  "0xdaa04f6819210b11fe4e3b65300c725c32e55755e3598671559b9ae3bac453d7";
const wsuperOETHb_WETH =
  "0x144bf18d6bf4c59602548a825034f73bf1d20177fc5f975fc69d5a5eba929b45";

const poolNames = {
  [cbBTC_WETH]: "cbBTC/WETH",
  [cbBTC_USDC]: "cbBTC/USDC",
  [WETH_USDC]: "WETH/USDC",
  [USDC_WETH]: "USDC/WETH",
  [AERO_USDC]: "AERO/USDC",
  [wsuperOETHb_WETH]: "wsuperOETHb/WETH",
};

// Function to convert timestamp to a readable date
function timestampToDate(ts) {
  const date = new Date(ts * 1000);
  return date.toISOString().split("T")[0]; // Returns date in YYYY-MM-DD format
}

// Function to generate a markdown table for historical APYs
function generateMarkdownTableForPool(poolName, historicalData) {
  const [collateralToken, loanToken] = poolName.split("/"); // Separate collateral and loan tokens
  let markdownTable = `\n`;
  markdownTable += `**Collateral Token**: ${collateralToken}, **Loan Token**: ${loanToken}\n\n`;
  markdownTable += `| Date       | APY (%) |\n|------------|---------|\n`; // Table header goes here

  let sumApy = 0;
  let count = 0;

  historicalData.forEach((entry) => {
    const date = timestampToDate(entry.x);
    const apy = entry.y !== null ? (entry.y * 100).toFixed(2) : "N/A";
    if (entry.y !== null) {
      sumApy += entry.y;
      count++;
    }
    markdownTable += `| ${date} | ${apy} |\n`;
  });

  const averageApy = count > 0 ? (sumApy / count) * 100 : null;

  markdownTable =
    `\n### Pool: ${poolName}\n**Average APY**: ${
      averageApy !== null ? averageApy.toFixed(2) : "N/A"
    }%\n\n` + markdownTable;

  return {
    markdownTable,
    averageApy,
    collateralToken,
    loanToken,
  };
}

// Function to generate markdown for all pools and the summary table
function generateMarkdownForAllPools(dataArray) {
  let markdownOutput = "";
  const summaryMatrix = {}; // To collect data for the final summary table
  const assets = ["WETH", "USDC", "cbBTC", "AERO", "wsuperOETHb"]; // Assets in the matrix

  // Initialize the summary matrix with placeholders
  assets.forEach((collateral) => {
    summaryMatrix[collateral] = {};
    assets.forEach((borrow) => {
      summaryMatrix[collateral][borrow] = collateral === borrow ? "-" : "X";
    });
  });

  dataArray.forEach((dataObject) => {
    const uniqueKey = dataObject.data.test.uniqueKey;
    const historicalData = dataObject.data.test.historicalState.weeklyBorrowApy;
    const poolName = poolNames[uniqueKey] || "Unknown Pool";
    const { markdownTable, averageApy, collateralToken, loanToken } =
      generateMarkdownTableForPool(poolName, historicalData);

    markdownOutput += markdownTable;

    // Fill the summary matrix with data from the current pool
    if (averageApy !== null && summaryMatrix[collateralToken]) {
      summaryMatrix[collateralToken][loanToken] = `${averageApy.toFixed(2)}%`; // Mark this relationship with average APY
    }
  });

  // Generate the summary matrix table with actual APYs
  let summaryTable = `\n### Assets Relationship Matrix - 2 month average APY\n\n`;
  summaryTable += `| collateral/loan | WETH       | USDC       | cbBTC      | AERO       | wsuperOETHb |\n`;
  summaryTable += `|----------------|------------|------------|------------|------------|-------------|\n`;

  assets.forEach((collateral) => {
    summaryTable += `| ${collateral.padEnd(16)} |`; // Collateral token column
    assets.forEach((borrow) => {
      summaryTable += ` ${summaryMatrix[collateral][borrow].padEnd(10)} |`;
    });
    summaryTable += `\n`;
  });

  markdownOutput += summaryTable;

  return markdownOutput;
}

// Main function to read data and generate markdown
function main() {
  const markdown = generateMarkdownForAllPools(dataArray);

  // Output markdown
  console.log(markdown);
}

main();
