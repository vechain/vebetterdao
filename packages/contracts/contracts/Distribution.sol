// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.8.2 <0.9.0;

contract Distribution {
    // Store the total votes pre round
    mapping(uint => uint) voteTotals;

    // Store the total votes for an app per voting round
    mapping(address => mapping(uint => uint)) votes;

    // Store voting history per round
    mapping(uint => mapping(address => bool)) voteHistory;

    function getCurrentRound() public pure returns (uint) {
        return 1;
    }

    function vote(address _address) public {
        // Get the current round
        uint currentRound = getCurrentRound();

        // Check if calling address has already voted in this round
        require(
            voteHistory[currentRound][msg.sender] == false,
            "You have already voted in this round"
        );

        // Update the vote for the app
        votes[_address][currentRound]++;

        // Update the total votes
        voteTotals[currentRound]++;

        // Record voting history
        voteHistory[currentRound][msg.sender] = true;
    }

    function getVotes(
        address _address,
        uint _round
    ) public view returns (uint, uint) {
        // Return the votes for the app and totals for the round
        return (votes[_address][_round], voteTotals[_round]);
    }
}
