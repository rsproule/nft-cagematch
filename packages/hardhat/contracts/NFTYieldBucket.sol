pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/interfaces/IERC721Receiver.sol";
import "@openzeppelin/contracts/interfaces/IERC721.sol";

// import "@chainlink/contracts/src/v0.8/VRFConsumerBase.sol";

contract NFTYieldBucket is IERC721Receiver {
    // keep track of the total estimated value of the bucket so that we can generate correct rewards for bucketeers
    uint256 public totalEstimatedValue;

    // keep track of when each nft was added to the bucket to correct track yeilds
    mapping(address => mapping(uint256 => uint256)) public nftAddedTimestamp;

    // keep track of the price of each nft added to the bucket
    mapping(address => mapping(uint => uint)) public nftAppraisablePrice;

    constructor() {}

    function addNFTToBucket(
        uint256 tokenId,
        address nftAddress,
        uint256 appraisalAmount
    ) public payable {
        require(nftAddedTimestamp[nftAddress][tokenId] == 0, "NFT already added to bucket");

        totalEstimatedValue += appraisalAmount;
        nftAddedTimestamp[nftAddress][tokenId] = block.timestamp;
        nftAppraisablePrice[nftAddress][tokenId] = appraisalAmount;
        
        // do some transferring
        IERC721(nftAddress).safeTransferFrom(msg.sender, address(this), tokenId);
    }


    function onERC721Received(
        address operator,
        address from,
        uint256 tokenId,
        bytes memory data
    ) public override returns (bytes4) {
        // mark the entry time for this nft
        // try to appraise
        return this.onERC721Received.selector;
    }
}
