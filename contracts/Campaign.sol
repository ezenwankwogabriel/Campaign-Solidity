//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;
import "hardhat/console.sol";

contract Campaign {
    
    address payable public creator;
    string public title;
    uint private idCounter;
    uint public targetAmount;
    uint public contributedSum;
    uint public createdAt;
    uint public expiresIn;
    uint8 private mask = 3;
    bool public canFund = true;

    enum Tiers {
      Bronze,
      Silver,
      Gold
    }
    
    // Mapping from contributor to amount contributed
    mapping(address => uint) public contributors; 
    
    // Mapping from token ID to contributor
    mapping(uint8 => address) private _tokenContributor;
    
    // Mapping from owner to token ID
    mapping(address => uint) private _contributorToken;
    
    event Contributed();
    event Withdrawn();
    event Transfer(address from, address to, uint8 tokenId);
    event ContributorWithdraw(address to, uint amount);
    event CreatorWithdraw(address from, address to, uint amount);
    
    modifier isCreator() {
        require(msg.sender == creator, "Only project creator can withdraw funds");
        _;
    }

    modifier fundingOpen() {
        require(canFund, "Project is fully funded");
        _;
    }

    constructor(uint _targetAmount, string memory _title) {
        creator = payable(msg.sender);
        targetAmount = _targetAmount;
        title = _title;
        createdAt = block.timestamp;
        expiresIn = createdAt + 30 days;
    }
    
    function contributeToProject() public payable fundingOpen {
        require(msg.value > 0.01 ether, "Mininum required amount is 0.01 ether");

        bool exceededTimeframe = block.timestamp > (createdAt + 30 days);

        if (exceededTimeframe) {
            canFund = false;
        }
        
        require(canFund, "Exceeded 30 days");

        contributedSum += msg.value;

        contributors[msg.sender] += msg.value;
        
        if (contributedSum >= targetAmount) {
            canFund = false;
        }
        console.log('contributed', canFund, contributedSum, targetAmount);
        
        if (contributors[msg.sender] >= 1 ether) {
            _mint(uint8(Tiers.Gold), msg.sender);
        } else if (contributors[msg.sender] >= 0.25 ether) {
            _mint(uint8(Tiers.Silver), msg.sender);
        } else {
            _mint(uint8(Tiers.Bronze), msg.sender);
        }

    }

    function getType(uint8 tokenId) public view returns (uint) {
        require(_tokenContributor[tokenId] != address(0), "Token does not exist");
        uint8 _type = tokenId & mask;
        return _type;
    }

    function contributorWithdraw() public {
        if (canFund) {
            bool exceededTimeframe = block.timestamp > (createdAt + 30 days);

            if (exceededTimeframe) {
                canFund = false;
            }
        }
        
        require(!canFund, "Project is still open");
        require(contributors[msg.sender] != 0, "Address has not funded this project");

        uint amount = contributors[msg.sender];
        contributors[msg.sender] = 0;
        _burn(msg.sender);

        (bool sent, ) = msg.sender.call{value: amount}("");
        require(sent, "Ether Withdraw failed");

        emit ContributorWithdraw(msg.sender, amount);
    }

    function creatorWithdraw(uint withdrawAmount) public isCreator {
        require(!canFund, "Project is not fully funded yet / is Closed");
        require(contributedSum >= targetAmount, "Project not fully funded");
        require(contributedSum > withdrawAmount, "Amount to withdraw exceeds contract funds");
        
        contributedSum = contributedSum - withdrawAmount;
        (bool paid, ) = creator.call{value: withdrawAmount}("");
        
        require(paid, "Failed to send Ether to Creator");

        emit CreatorWithdraw(msg.sender, creator, withdrawAmount);
    }

    function cancelProject() public isCreator fundingOpen {
        require(canFund, "Project is already closed or fully funded");

        canFund = false;
    }
    
    function _mint(uint8 _type, address to) internal {
      uint8 tokenId = uint8(idCounter << mask) + _type;
      _tokenContributor[tokenId] = to;
      _contributorToken[to] = tokenId;
      idCounter += 1;

        emit Transfer(msg.sender, to, tokenId);
    }

    function getToken(address _address) public view returns (uint) {
        return _contributorToken[_address];
    }

    function _burn(address sender) internal {
        require(_contributorToken[sender] != 0, "No token exist for user");

        _contributorToken[sender] = 0;
    }

    function balanceOf(address _address) public view returns (uint) {
        return contributors[_address];
    }

    function ownerOf(uint8 tokenId) public view returns (address) {
        return _tokenContributor[tokenId];
    } 
    
    receive() external payable {}
}