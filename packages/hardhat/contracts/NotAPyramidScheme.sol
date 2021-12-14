pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/access/Ownable.sol";

contract NotAPyramidScheme is Ownable {
    struct Node {
        address nodeAddress;
        address parentAddress;
        uint256 donationSize;
        uint256 cumulativeBranchDonationSize;
        uint256 nodeHeight;
    }

    Node public rootNode;
    uint256 public totalNodes;
    uint256 public treasuryBalance;

    mapping(address => Node) public nodes;
    mapping(address => uint256) public unclaimedRewards;

    event IncreaseReward(address nodeAddress, uint256 amount);
    event ClaimReward(address claimer, address amountToClaim);
    event Contribute(address contributor, address parent, uint256 amount);

    constructor(uint256 donation) {
        rootNode = Node(msg.sender, address(0), donation, donation, 0);
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
        uint256 amount = msg.value;

        Node memory parentNode = nodes[parent];
        Node memory newNode = Node(
            msg.sender,
            parent,
            amount,
            amount + parentNode.cumulativeBranchDonationSize,
            parentNode.nodeHeight + 1
        );
        nodes[msg.sender] = newNode;

        // send the chunk of the donation that doesnt need to reward the branch
        uint256 donationSize = amount / 2; // amount - (amount / rewardRatio);
        // (bool sent, bytes memory data) = address(this).call{value: msg.value}(
        //     ""
        // );
        treasuryBalance += donationSize;
        totalNodes += 1;
        rewardAllLevelsTillRootIteratively(newNode, donationSize);
        emit Contribute(msg.sender, parent, amount);
    }

    function claimRewards(address rewardee) public payable {
        require(msg.sender == rewardee, "You can only claim your own rewards");
        require(
            unclaimedRewards[msg.sender] > 0,
            "You have no rewards to claim"
        );
        uint256 amount = unclaimedRewards[msg.sender];
        unclaimedRewards[msg.sender] = 0; // reentrancy protection
        payable(msg.sender).transfer(amount);
    }

    // This function scales poorly against the height of the tree O(n). Not aware of a better way to do this.
    // just means the earlier you are, the less gas you will pay (pyramid scheme theme fits)
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
        while (currentNode.parentAddress != address(0)) {
            currentNode = nodes[currentNode.parentAddress];
            address addressToReward = currentNode.nodeAddress;
            // reward size should follow the geometric progression
            // this means that if the tree has ingfinite height that the sum of the rewards still would not
            // breach the total reward size. Div by 2 is SUM(k/n^2).
            uint256 baseReward = (totalRewardRemaining / 2);
            // The spill is from the fact that only an infitinely tall tree can consume the entire
            // reward. So each node in the branch get a portion of this spill based on the percntage
            // of the branch they own. 
            uint256 amountToReward = baseReward +
                (spillOver / (totalBranchValue / currentNode.donationSize));
            totalRewardRemaining -= baseReward;
            unclaimedRewards[addressToReward] += amountToReward;
            emit IncreaseReward(addressToReward, amountToReward);
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
        return rewardTotal / (2**height);
    }

    // probable more interesting if this treasury is managed by governence
    function withdrawTreasury(uint amountToWithdraw) public onlyOwner {
        treasuryBalance -= amountToWithdraw;
        payable(msg.sender).transfer(amountToWithdraw);
    }
    
}
