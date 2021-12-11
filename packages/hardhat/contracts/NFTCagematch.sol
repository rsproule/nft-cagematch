// pragma solidity >=0.8.0 <0.9.0;

// import "@openzeppelin/contracts/interfaces/IERC721Receiver.sol";

// contract NFTCagematch is IERC721Receiver {

//     // need to hold each round 
//     struct Round {
//         uint roundId;
//         Entry entryA;
//         Entry entryB;
//     }

//     struct Entry {
//         address participant;
//         uint collateralId;
//         uint roundId;
//     }

//     struct Cagematch {
//         uint currentRoundId;
//         Entry[] allEntries;
//     }

//     struct CagematchRules {
//         uint maxRounds;
//         uint maxEntries;
//         uint lossesTillElimination; // or something like this
//     }

//     // need to hold the votes for each individual round
//     constructor() {

//     }


// }