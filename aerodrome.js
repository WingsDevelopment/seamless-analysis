const dataArray = require("./aerodrome-data.json");

function calculateVolatility(apyArray) {
  let differences = [];
  for (let i = 1; i < apyArray.length; i++) {
    const prev = apyArray[i - 1];
    const current = apyArray[i];
    if (prev && current) {
      const diff = ((current - prev) / prev) * 100;
      differences.push(diff);
    }
  }

  if (differences.length === 0) return 0;

  const mean = differences.reduce((a, b) => a + b, 0) / differences.length;
  const variance =
    differences.map((x) => Math.pow(x - mean, 2)).reduce((a, b) => a + b, 0) /
    differences.length;
  const stdDeviation = Math.sqrt(variance);

  return stdDeviation;
}

function generateEpochTableForPool(epochData) {
  const markdownHeader = `| Epoch | Fees ($) | Fee APR (%) | Bribe APR (%) | TVL ($) | Number of Swaps | Swap Fees ($) | Emission | Emission Value ($) | Yield APR (%) | Volume ($) |\n|-------|----------|-------------|---------------|---------|-----------------|---------------|----------|---------------------|----------------|------------|\n`;
  let markdownTable = markdownHeader;

  epochData.forEach((epoch) => {
    const fees = epoch["Fees"] !== null ? epoch["Fees"].toFixed(2) : "N/A";
    const feeAPR =
      epoch["Fees APR"] !== null ? (epoch["Fees APR"] * 100).toFixed(2) : "N/A";
    const bribeAPR =
      epoch["Bribes APR"] !== null
        ? (epoch["Bribes APR"] * 100).toFixed(2)
        : "N/A";
    const tvl = epoch["TVL"] !== null ? epoch["TVL"].toFixed(2) : "N/A";
    const swaps = epoch["# Swap"] !== null ? epoch["# Swap"] : "N/A";
    const swapFees =
      epoch["Swap Fees"] !== null ? epoch["Swap Fees"].toFixed(2) : "N/A";
    const emission =
      epoch["Emission"] !== null ? epoch["Emission"].toFixed(2) : "N/A";
    const emissionValue =
      epoch["Emission Value"] !== null
        ? epoch["Emission Value"].toFixed(2)
        : "N/A";
    const yieldAPR =
      epoch["Yield APR"] !== null
        ? (epoch["Yield APR"] * 100).toFixed(2)
        : "N/A";
    const volume =
      epoch["Volume"] !== null ? epoch["Volume"].toFixed(2) : "N/A";

    markdownTable += `| ${epoch["Epoch"]} | ${fees} | ${feeAPR} | ${bribeAPR} | ${tvl} | ${swaps} | ${swapFees} | ${emission} | ${emissionValue} | ${yieldAPR} | ${volume} |\n`;
  });

  return markdownTable;
}

function analyzeEpochs(epochDataArray) {
  let markdownOutput = "";

  epochDataArray.forEach((epochData) => {
    const poolSymbol = epochData[0]["Pool Symbol"];
    markdownOutput += `\n### Pool: ${poolSymbol}\n\n`;
    markdownOutput += generateEpochTableForPool(epochData);
  });

  const markdownHeader = `| Pool Symbol | Total Epochs Considered | Date Range | Average Fees ($) | Average Fee APR (%) | Average Bribe APR (%) | Most Common Bribe Token | Average TVL ($) | Average Number of Swaps | Average Swap Fees ($) | Average Emission | Average Emission Value ($) | Average Yield APR (%) | Average Volume ($) | Fee APR Volatility (%) | Bribe APR Volatility (%) | Yield APR Volatility (%) |\n|-------------|------------------------|------------|------------------|--------------------|--------------------|------------------------|-----------------|----------------------|--------------------|----------------|-------------------------|---------------------|----------------|--------------------|----------------------|---------------------|\n`;

  let markdownTable = markdownHeader;

  epochDataArray.forEach((epochData) => {
    const totalEpochs = epochData.length;
    const now = new Date();
    const startDate = new Date(
      now.getTime() - totalEpochs * 7 * 24 * 60 * 60 * 1000
    );

    let totalFees = 0;
    let totalFeeAPR = 0;
    let totalBribeAPR = 0;
    let totalTVL = 0;
    let totalSwaps = 0;
    let totalSwapFees = 0;
    let totalEmission = 0;
    let totalEmissionValue = 0;
    let totalYieldAPR = 0;
    let totalVolume = 0;

    let feeAprCount = 0;
    let bribeAprCount = 0;
    let yieldAprCount = 0;
    let bribeTokens = {};

    const poolSymbol = epochData[0]["Pool Symbol"];

    let feeApyArray = [];
    let bribeApyArray = [];
    let yieldApyArray = [];

    epochData.forEach((epoch) => {
      if (epoch["Fees"] !== null) totalFees += epoch["Fees"];
      if (epoch["Fees APR"] !== null) {
        totalFeeAPR += epoch["Fees APR"];
        feeAprCount++;
        feeApyArray.push(epoch["Fees APR"]);
      }
      if (epoch["Bribes APR"] !== null) {
        totalBribeAPR += epoch["Bribes APR"];
        bribeAprCount++;
        bribeApyArray.push(epoch["Bribes APR"]);
      }
      if (epoch["TVL"] !== null) totalTVL += epoch["TVL"];
      if (epoch["# Swap"] !== null) totalSwaps += epoch["# Swap"];
      if (epoch["Swap Fees"] !== null) totalSwapFees += epoch["Swap Fees"];
      if (epoch["Emission"] !== null) totalEmission += epoch["Emission"];
      if (epoch["Emission Value"] !== null)
        totalEmissionValue += epoch["Emission Value"];
      if (epoch["Yield APR"] !== null) {
        totalYieldAPR += epoch["Yield APR"];
        yieldAprCount++;
        yieldApyArray.push(epoch["Yield APR"]);
      }
      if (epoch["Volume"] !== null) totalVolume += epoch["Volume"];
      if (epoch["Bribe Tokens List"] !== null) {
        const tokens = epoch["Bribe Tokens List"].split(" ");
        tokens.forEach((token) => {
          if (bribeTokens[token]) {
            bribeTokens[token]++;
          } else {
            bribeTokens[token] = 1;
          }
        });
      }
    });

    const avgFees = totalFees / totalEpochs;
    const avgFeeAPR = feeAprCount > 0 ? totalFeeAPR / feeAprCount : 0;
    const avgBribeAPR = bribeAprCount > 0 ? totalBribeAPR / bribeAprCount : 0;
    const avgTVL = totalTVL / totalEpochs;
    const avgSwaps = totalSwaps / totalEpochs;
    const avgSwapFees = totalSwapFees / totalEpochs;
    const avgEmission = totalEmission / totalEpochs;
    const avgEmissionValue = totalEmissionValue / totalEpochs;
    const avgYieldAPR = yieldAprCount > 0 ? totalYieldAPR / yieldAprCount : 0;
    const avgVolume = totalVolume / totalEpochs;

    const mostCommonBribeToken = Object.keys(bribeTokens).reduce(
      (a, b) => (bribeTokens[a] > bribeTokens[b] ? a : b),
      ""
    );

    const dateRangeText = `From ${startDate.toDateString()} to ${now.toDateString()}`;

    const feeApyVolatility = calculateVolatility(feeApyArray);
    const bribeApyVolatility = calculateVolatility(bribeApyArray);
    const yieldApyVolatility = calculateVolatility(yieldApyArray);

    markdownTable += `| ${poolSymbol} | ${totalEpochs} | ${dateRangeText} | ${avgFees.toFixed(
      2
    )} | ${(avgFeeAPR * 100).toFixed(2)} | ${(avgBribeAPR * 100).toFixed(
      2
    )} | ${mostCommonBribeToken} | ${avgTVL.toFixed(2)} | ${avgSwaps.toFixed(
      2
    )} | ${avgSwapFees.toFixed(2)} | ${avgEmission.toFixed(
      2
    )} | ${avgEmissionValue.toFixed(2)} | ${(avgYieldAPR * 100).toFixed(
      2
    )} | ${avgVolume.toFixed(2)} | ${feeApyVolatility.toFixed(
      2
    )} | ${bribeApyVolatility.toFixed(2)} | ${yieldApyVolatility.toFixed(
      2
    )} |\n`;
  });

  markdownOutput += `\n### Averaged Data for All Pools\n\n${markdownTable}`;

  console.log(markdownOutput);
}

analyzeEpochs(dataArray);
