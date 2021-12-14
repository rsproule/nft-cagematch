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
    it("should not allow 0 donation", async () => {
      const [user1, user2] = await ethers.getSigners();
      const treasuryBalanceAtStart = await pyramid.treasuryBalance();
      try {
        await pyramid.connect(user2).contribute(user1.address, { value: 0 });
      } catch (error) {
        expect(error.message).to.include("You must contribute at least 1 wei");
      }
      const treasuryBalanceAfterContribution = await pyramid.treasuryBalance();
      expect(treasuryBalanceAfterContribution).to.equal(treasuryBalanceAtStart);
    });
    it("should not allow passing self as parent", async () => {
      const [, user2] = await ethers.getSigners();
      const treasuryBalanceAtStart = await pyramid.treasuryBalance();
      try {
        await pyramid.connect(user2).contribute(user2.address, { value: 100 });
      } catch (error) {
        expect(error.message).to.include("Parent node does not exist");
      }
      const treasuryBalanceAfterContribution = await pyramid.treasuryBalance();
      expect(treasuryBalanceAfterContribution).to.equal(treasuryBalanceAtStart);
    });
    it("should not allow passing invalid parent", async () => {
      const [, user2, user3] = await ethers.getSigners();
      const treasuryBalanceAtStart = await pyramid.treasuryBalance();
      try {
        await pyramid.connect(user2).contribute(user3.address, { value: 100 });
      } catch (error) {
        expect(error.message).to.include("Parent node does not exist");
      }
      const treasuryBalanceAfterContribution = await pyramid.treasuryBalance();
      expect(treasuryBalanceAfterContribution).to.equal(treasuryBalanceAtStart);
    });
    it("contribute down the branch", async () => {
      const [user1, user2, user3, user4] = await ethers.getSigners();
      const treasuryBalanceAtStart = await pyramid.treasuryBalance();
      await pyramid.connect(user2).contribute(user1.address, { value: 100 });
      await pyramid.connect(user3).contribute(user2.address, { value: 100 });
      await pyramid.connect(user4).contribute(user3.address, { value: 100 });
      const treasuryBalanceAfterContribution = await pyramid.treasuryBalance();
      // expect the treasury to hold at least half of all the donations made
      expect(
        treasuryBalanceAfterContribution.toNumber()
      ).to.be.greaterThanOrEqual(
        treasuryBalanceAtStart.toNumber() + 50 + 50 + 50
      );
      const user1UnclaimedRewards = await pyramid.unclaimedRewards(
        user1.address
      );
      const user2UnclaimedRewards = await pyramid.unclaimedRewards(
        user2.address
      );
      const user3UnclaimedRewards = await pyramid.unclaimedRewards(
        user3.address
      );
      const user4UnclaimedRewards = await pyramid.unclaimedRewards(
        user4.address
      );
      // expect the users higher up in the tree to have more rewards
      expect(user1UnclaimedRewards.toNumber()).to.be.greaterThan(
        user2UnclaimedRewards.toNumber()
      );
      expect(user2UnclaimedRewards.toNumber()).to.be.greaterThan(
        user3UnclaimedRewards.toNumber()
      );
      expect(user3UnclaimedRewards.toNumber()).to.be.greaterThan(
        user4UnclaimedRewards.toNumber()
      );
    });
    it("find limit of tree height", async () => {
      const addresses = await ethers.getSigners();
      let currentUserIndex = 1;
      let previousUser = 0;
      while (true) {
        // console.log(addresses.map(address))
        let gasUsage = await pyramid.connect(addresses[currentUserIndex]).estimateGas.contribute(addresses[previousUser].address, { value: 100 });
        await pyramid.connect(addresses[currentUserIndex]).contribute(addresses[previousUser].address, { value: 100 });
        console.log(gasUsage.toNumber());
        currentUserIndex++;
        previousUser++;
      }
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
