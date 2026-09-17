pragma solidity ^0.8.28;

interface BountyEscrow {
    function acceptBounty(uint256 id) external;
    function completeBounty(uint256 id) external;
}

contract BountyReceiver {
    address public board;
    uint256 public bountyId;
    bool public rejectPayment = true;
    bool public reentrySucceeded;
    bytes public reentryError;
    uint256 public received;

    function accept(address contractAddress, uint256 id) external {
        board = contractAddress;
        bountyId = id;
        BountyEscrow(board).acceptBounty(id);
    }

    function allowPayment() external {
        rejectPayment = false;
    }

    receive() external payable {
        require(!rejectPayment);
        (reentrySucceeded, reentryError) = board.call(
            abi.encodeCall(BountyEscrow.completeBounty, (bountyId))
        );
        received += msg.value;
    }
}
