# Crowdfundr Application

## Background
This project implements a crowdfunding contract. Projects are created and crowdfunded by contributors who receive tier NTFs with respect to amount contributed.
# Deployed Address
0x5FbDB2315678afecb367f032d93F642f64180aa3

## Specs
  - The contribute amount must be at least 0.01 ETH.
  - Anyone can contribute to the project, including the creator.
  - One address can contribute as many times as they like.
  - Bronze tier is granted to anyone contribution.
  - Silver tier is granted to a total contribution of at least 0.25 ETH.
  - Gold tier is granted to a total contribution of at least 1 ETH.
  - Tiers should be granted immediately so other apps can read them.
  - "Total contribution" is scoped per-project (like kickstarter).
  - If the project is not fully funded within 30 days:
    - The project goal is considered to have failed.
    - No one can contribute anymore.
    - Supporters get their money back.
    - Tier grants are revoked.
  - Once a project becomes fully funded:
    - No one else can contribute (however, the last contribution can go over the goal).
    - The creator can withdraw any percentage of contributed funds.
  - The creator can choose to cancel their project before the 30 days are over, which has the same effect as a project failing.

# Development

## Steps to start the app
cd to app folder
install dependencies using `npm i`
compile application using `npx hardhat compile`
deploy application using `npx hardhat run scripts/campaign-script.js`

## Steps and commands to run the test
cd to app folder
run test using command `npx hardhat test`

