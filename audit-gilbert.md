https://github.com/ezenwankwogabriel/Campaign-Solidity

The following is a micro audit of git commit 610f0ffd078419fa4c905015a5573e6703c192f8 by Gilbert.

## General comments

- No factory contract
- There's duplicate logic for checking exceeded time frame across two functions. Consider abstracting a bit.


## issue-1

**[High]** Lost funds

After a project is successful, if the project creator withdraws part (but not all) of the funds, the rest of the funds get stuck; Campaign.sol:116 will prevent them from withdrawing again, since line 119 decreases the value of contributedSum.


## issue-2

**[High]** Contributors can withdraw funds after project is successful

Campaign.sol's `canFund` does not distinquish between success or failure. When a project succeeds, `canFund` is set to false, which still allows contributors to call contributorWithdraw() successfullly.


## issue-3

**[High]** Standard conflict

Campaign.sol's balanceOf() function conflicts with ERC-721's balanceOf() specification.


## issue-4

**[Code Quality]** Unused variable

In Campaign.sol, expiresIn is not used. Consider using it to save gas.


## Nitpicks

- `private` is not necessary when there is no inheritance involved.
- uint8 mask should be a constant.
- _burn() does not need to check for the zero address since it is an internal function.