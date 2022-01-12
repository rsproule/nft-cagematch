pragma solidity >=0.8.0 <0.9.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract NotAPyramidScheme is Ownable {
    struct Node {
        address nodeAddress;
        address parentAddress;
        uint256 donationSize;
        uint256 cumulativeBranchDonationSize;
        uint256 nodeHeight;
        uint256 numChildren;
    }

    Node public rootNode;
    uint256 public totalNodes;
    uint256 public treasuryBalance;

    mapping(address => Node) public nodes;
    mapping(address => uint256) public unclaimedRewards;

    event IncreaseReward(address nodeAddress, uint256 donationSize);
    event ClaimReward(address claimer, address donationSizeToClaim);
    event Contribute(address contributor, address parent, uint256 donationSize);

    constructor(uint256 donation) {
        rootNode = Node(msg.sender, address(0), donation, donation, 0, 0);
        totalNodes = 1;
        nodes[msg.sender] = rootNode;
        treasuryBalance = donation;
        emit Contribute(msg.sender, address(0), donation);
    }

    // Function to receive Ether. msg.data must be empty
    receive() external payable {}

    // Fallback function is called when msg.data is not empty
    fallback() external payable {}

    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }

    // TODO: add some whitelisting functionality that only allows people to contribute if the "parent" allowed them to.
    // Otherwise everyone will just create a node under root and avoid paying fees up the the branch.
    function contribute(address parent) public payable {
        require(
            nodes[msg.sender].nodeAddress == address(0),
            "You have already contributed"
        );
        require(
            nodes[parent].nodeAddress != address(0),
            "Parent node does not exist"
        );
        require(msg.value > 0, "You must contribute at least 1 wei");
        uint256 donationSize = msg.value;

        Node memory parentNode = nodes[parent];
        parentNode.numChildren++;
        Node memory newNode = Node(
            msg.sender,
            parent,
            donationSize,
            donationSize + parentNode.cumulativeBranchDonationSize,
            parentNode.nodeHeight + 1,
            0
        );
        nodes[msg.sender] = newNode;

        // half of the donation goes to the treausury
        treasuryBalance += donationSize / 2;
        totalNodes += 1;
        // half of the donation goes up the branch
        rewardAllLevelsTillRootIteratively(newNode, donationSize / 2);
        emit Contribute(msg.sender, parent, donationSize);
    }

    function claimRewards(address rewardee) public payable {
        require(msg.sender == rewardee, "You can only claim your own rewards");
        require(
            unclaimedRewards[msg.sender] > 0,
            "You have no rewards to claim"
        );
        uint256 donationSize = unclaimedRewards[msg.sender];
        unclaimedRewards[msg.sender] = 0; // reentrancy protection
        payable(msg.sender).transfer(donationSize);
    }

    function rewardAllLevelsTillRootIteratively(
        Node memory currentNode,
        uint256 totalRewardSize
    ) private {
        address initialNode = currentNode.nodeAddress;
        uint256 totalRewardRemaining = totalRewardSize;
        uint256 totalBranchValue = currentNode.cumulativeBranchDonationSize;
        // spill over is a function of the height of the tree, as this approaches inf,
        // this approaches 0
        uint256 spillOver = calculateSpillOver(
            totalRewardRemaining,
            currentNode.nodeHeight
        );
        uint spillPaid = 0;
        uint index = 0;
        while (currentNode.parentAddress != address(0)) {
            currentNode = nodes[currentNode.parentAddress];
            address addressToReward = currentNode.nodeAddress;
            // reward size should follow the geometric progression
            // this means that if the tree has ingfinite height that the sum of the rewards still would not
            // breach the total reward size. Div by 2 is SUM(k/n^2).
            uint256 baseReward = (totalRewardRemaining / 2);
            // this optimization to break when reward is empty ends up being critical. 
            // This caps the total number of iterations that this can go through at DonationSize/2^n. 
            // which has an upperbound of 255 (would cost 2^256 ether) because of the size of uint256. 
            if (baseReward < 1) {
                break;
            }
            // The spill is from the fact that only an infitinely tall tree can consume the entire
            // reward. So each node in the branch get a portion of this spill based on the percntage
            // of the branch they own. 
            uint256 donationSizeToReward = baseReward +
                (spillOver / (totalBranchValue / currentNode.donationSize));
            totalRewardRemaining -= baseReward;
            unclaimedRewards[addressToReward] += donationSizeToReward;
            emit IncreaseReward(addressToReward, donationSizeToReward);
            index++;
        }

        nodes[initialNode].cumulativeBranchDonationSize += spillOver - spillPaid;
        nodes[initialNode].donationSize += spillOver - spillPaid;
        totalRewardRemaining -= spillOver;

        // total reward remaining here might carry some of the dust from integer division. Send it to the treasury
        treasuryBalance += totalRewardRemaining;
    }

    // turns out to be super simply the reward divided by 2^height of node
    function calculateSpillOver(uint256 rewardTotal, uint256 height)
        private
        pure
        returns (uint256)
    {
        // when height is 256, this will underflow. 
        if (height >= 256) {
            return 0;
        }
        return rewardTotal / (2**height);
    }

    // probable more interesting if this treasury is managed by governence
    function withdrawTreasury(uint donationSizeToWithdraw) public onlyOwner {
        treasuryBalance -= donationSizeToWithdraw;
        payable(msg.sender).transfer(donationSizeToWithdraw);
    }
    
}
