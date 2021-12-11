pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";


contract ExampleNFT is ERC721 {
    uint currentId; 
    constructor() ERC721("Garbageum", "GARB") public {

        currentId = 0; 
     }


    function mint() public {
        _mint(msg.sender, currentId);
        currentId++;
    }
}