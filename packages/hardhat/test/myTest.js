const { ethers } = require("hardhat");
const { use, expect } = require("chai");
const { solidity } = require("ethereum-waffle");

use(solidity);

describe("My Dapp", function () {
  let yieldBucketContract;
  let exampleNft;
  let nfToken1;
  let pyramid;
  // quick fix to let gas reporter fetch data from gas station & coinmarketcap
  // before(async (done) => {
  //   setTimeout(done, 2000);
  // });

  beforeEach(async () => {
    console.log("beforeAll");
    const YieldBucket = await ethers.getContractFactory("NFTYieldBucket");
    const nftExample = await ethers.getContractFactory("ExampleNFT");
    exampleNft = await nftExample.deploy();
    yieldBucketContract = await YieldBucket.deploy();

    nfToken1 = await exampleNft.mint();
    await exampleNft.approve(yieldBucketContract.address, 0);


    // deploy the pyramid scheme 
    const pyramidDAO = await ethers.getContractFactory("NotAPyramidScheme");
    pyramid = await pyramidDAO.deploy(10);

  });

  describe("YourContract", function () {
    it("addNft()", async function () {
      const result = await yieldBucketContract.addNFTToBucket(
        0,
        exampleNft.address,
        123
      );
      const timestampOffAdd = await yieldBucketContract.nftAddedTimestamp(
        exampleNft.address,
        0
      );

      console.log(timestampOffAdd.toString());
    });
  });
});
