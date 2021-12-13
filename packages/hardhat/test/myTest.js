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
    pyramid = await pyramidDAO.deploy(100);
  });

  describe("test full scheme", async () => {
    // assume the contract has already been deployed, check on the root node
    it("contribute down the branch", async () => {
      const [user1, user2, user3, user4] = await ethers.getSigners();
      const treasuryBalanceAtStart = await pyramid.treasuryBalance();
      console.log(user2.address + " contributes 100 under: " + user1.address);
      await pyramid.connect(user2).contribute(user1.address, { value: 100 });
      console.log(user3.address + " contributes 100 under: " + user2.address);
      await pyramid.connect(user3).contribute(user2.address, { value: 1000 });
      console.log(user4.address + " contributes 100 under: " + user3.address);
      await pyramid.connect(user4).contribute(user3.address, { value: 100 });
      const treasuryBalanceAfterContribution = await pyramid.treasuryBalance();
      console.log(treasuryBalanceAtStart.toString());
      console.log(treasuryBalanceAfterContribution.toString());
      console.log(
        user1.address +
          " has " +
          (await pyramid.unclaimedRewards(user1.address))
      );
      console.log(
        user2.address +
          " has " +
          (await pyramid.unclaimedRewards(user2.address))
      );
      console.log(
        user3.address +
          " has " +
          (await pyramid.unclaimedRewards(user3.address))
      );
      console.log(
        user4.address +
          " has " +
          (await pyramid.unclaimedRewards(user4.address))
      );
    });
  });
  // describe("YourContract", function () {
  //   it("addNft()", async function () {
  //     const result = await yieldBucketContract.addNFTToBucket(
  //       0,
  //       exampleNft.address,
  //       123
  //     );
  //     const timestampOffAdd = await yieldBucketContract.nftAddedTimestamp(
  //       exampleNft.address,
  //       0
  //     );

  //     console.log(timestampOffAdd.toString());
  //   });
  // });
});
