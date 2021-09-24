const { expect } = require("chai");
const { ethers } = require("hardhat");

const provider = ethers.getDefaultProvider();

function toEther(amount) {
  return ethers.utils.parseEther(String(amount));
}


describe("Campaign", () => {
  let owner, account1, campaign, targetAmount, title
  beforeEach(async() => {
    targetAmount = ethers.utils.parseEther('1000.0');
    title = "Project 1";

    [owner, account1] = await hre.ethers.getSigners();
    
    const Campaign = await ethers.getContractFactory("Campaign");
    campaign = await Campaign.deploy(targetAmount, title);
  })

  describe('contract setup', () => {
    it('can create a project', async () => {
      expect(await campaign.creator()).to.equal(owner.address);
      expect(await campaign.title()).to.equal(title)
      expect(await campaign.targetAmount()).to.equal(targetAmount)
    })
  })

  describe('contribute to project', () => {
    it('allows contributors fund a project', async () => {
      const contribution = toEther(1);
      await campaign.contributeToProject({value: contribution});
      await campaign.connect(account1).contributeToProject({value: contribution});
  
      const firstContribution = await campaign.contributors(owner.address)
      const secondContribution = await campaign.contributors(account1.address)
  
      const tokenId = await campaign.getToken(owner.address);
  
      expect(await campaign.getType(tokenId)).to.equal(2);
      expect(firstContribution.toString()).to.equal(contribution)
      expect(secondContribution.toString()).to.equal(contribution)
    });
  
    it('rejects a project if fully funded', async() => {
      let error = false, message;
      try {
        await campaign.contributeToProject({value: toEther(1001)});
    
        expect(await campaign.fullyFunded()).to.equal(true);
    
        await campaign.contributeToProject({ value: toEther(1) })
      } catch (ex) {
        message = ex.message;
        error = true;
      }
  
      expect(error).to.equal(true);
      expect(message).to.include('Project is fully funded');
    })
  })

  describe('creator', () => {
    it('can withdraw any amount when project is fully funded', async () => {
      try {
        await campaign.contributeToProject({ value: toEther(1001) });
        const tx = await campaign.creatorWithdraw(toEther(100));

        expect(tx)
          .to
          .emit(campaign, 'CreatorWithdraw')
          .withArgs(owner.address, owner.address, toEther(100));
      } catch (ex) {
        throw ex;
      }
    })

    it('fails to withdraw if address is not creator', async () => {
      let error = false, message;
      try {
        await campaign.connect(account1).creatorWithdraw(1)
      } catch(ex) {
        message = ex.message;
        error = true;
      }
      expect(message).to.include('Only project creator can withdraw funds');
      expect(error).to.equal(true)
    })
    
    it('fails if creator attempts to withdraw before project is fully funded', async () => {
      let error = false, message;
      try {
        await campaign.creatorWithdraw(1)
      } catch(ex) {
        message = ex.message;
        error = true;
      }
      expect(message).to.include('Project is not fully funded yet');
      expect(error).to.equal(true)
    })
  
    it('fails if creator attempts to withdraw more than contributed amount', async () => {
      let error = false, message;
      try {
        await campaign.contributeToProject({value: toEther(1001) })
        await campaign.creatorWithdraw(toEther(1002));
      } catch(ex) {
        message = ex.message;
        error = true;
      }
      expect(message).to.include('Amount to withdraw exceeds contract funds');
      expect(error).to.equal(true)
    })
  })
  
  describe('contributor', () => {
    it('can withdraw funds if project is exceeds 30 days', async() => {
      await campaign.contributeToProject({ value: toEther(10) })
      await network.provider.send("evm_increaseTime", [2.592e+6]);
      await network.provider.send("evm_mine");

      const tx = await campaign.contributorWithdraw();

      expect(tx)
        .to
        .emit(campaign, 'ContributorWithdraw')
        .withArgs(owner.address, toEther(10));
      
    })

    it('can withdraw funds if project is canceled', async() => {
      await campaign.contributeToProject({ value: toEther(10) })
      await campaign.cancelProject();
      expect(await campaign.fundingClosed()).to.equal(true);

      const tx = await campaign.contributorWithdraw();
      
      expect(tx)
        .to
        .emit(campaign, 'ContributorWithdraw')
        .withArgs(owner.address, toEther(10));
    })
    
    it('cannot withdraw funds if project is not canceled / withing 30 days', async() => {
      let error, message;
      try {
        await campaign.contributeToProject({ value: toEther(10) })
        await campaign.contributorWithdraw();
      } catch(ex) {
        message = ex.message;
        error = true;
      }

      expect(message).to.include('Project is still open');
      expect(error).to.equal(true)
    })
  })



});
