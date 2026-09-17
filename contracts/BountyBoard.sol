pragma solidity ^0.8.28;

contract BountyBoard {
    enum Status { Open, InProgress, Completed, Cancelled }
    struct Bounty {
        address creator;
        address worker;
        string metadata;
        uint256 reward;
        Status status;
    }

    mapping(uint256 => Bounty) private entries;
    uint256 public bountyCount;
    bool private entered;

    error InvalidMetadata();
    error InvalidReward();
    error NotFound();
    error InvalidStatus();
    error OnlyCreator();
    error CannotAcceptOwnBounty();
    error TransferFailed();
    error ReentrantCall();

    event BountyCreated(uint256 indexed bountyId, address indexed creator, uint256 reward);
    event BountyAccepted(uint256 indexed bountyId, address indexed worker);
    event BountyCompleted(uint256 indexed bountyId, address indexed worker, uint256 reward);
    event BountyCancelled(uint256 indexed bountyId, address indexed creator, uint256 reward);

    modifier nonReentrant() {
        if (entered) revert ReentrantCall();
        entered = true;
        _;
        entered = false;
    }

    function getBounty(uint256 id) external view returns (Bounty memory) {
        if (id == 0 || id > bountyCount) revert NotFound();
        return entries[id];
    }

    function createBounty(string calldata metadata) external payable returns (uint256 id) {
        if (bytes(metadata).length == 0 || bytes(metadata).length > 12000) revert InvalidMetadata();
        if (msg.value == 0) revert InvalidReward();
        id = ++bountyCount;
        entries[id] = Bounty(msg.sender, address(0), metadata, msg.value, Status.Open);
        emit BountyCreated(id, msg.sender, msg.value);
    }

    function acceptBounty(uint256 id) external {
        Bounty storage bounty = entries[id];
        if (id == 0 || id > bountyCount) revert NotFound();
        if (bounty.status != Status.Open) revert InvalidStatus();
        if (bounty.creator == msg.sender) revert CannotAcceptOwnBounty();
        bounty.worker = msg.sender;
        bounty.status = Status.InProgress;
        emit BountyAccepted(id, msg.sender);
    }

    function completeBounty(uint256 id) external nonReentrant {
        Bounty storage bounty = entries[id];
        if (id == 0 || id > bountyCount) revert NotFound();
        if (bounty.creator != msg.sender) revert OnlyCreator();
        if (bounty.status != Status.InProgress) revert InvalidStatus();
        bounty.status = Status.Completed;
        (bool success,) = payable(bounty.worker).call{value: bounty.reward}("");
        if (!success) revert TransferFailed();
        emit BountyCompleted(id, bounty.worker, bounty.reward);
    }

    function cancelBounty(uint256 id) external nonReentrant {
        Bounty storage bounty = entries[id];
        if (id == 0 || id > bountyCount) revert NotFound();
        if (bounty.creator != msg.sender) revert OnlyCreator();
        if (bounty.status != Status.Open) revert InvalidStatus();
        bounty.status = Status.Cancelled;
        (bool success,) = payable(bounty.creator).call{value: bounty.reward}("");
        if (!success) revert TransferFailed();
        emit BountyCancelled(id, bounty.creator, bounty.reward);
    }
}
