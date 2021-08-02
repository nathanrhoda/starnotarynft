const StarNotary = artifacts.require("./StarNotary.sol");

var accounts;
var owner;

contract('StarNotary', (accs) => {
    accounts = accs;
    owner = accounts[0];
});

it('can Create a Star', async() => {
    let tokenId = 1;
    let instance = await StarNotary.deployed();
    await instance.createStar('Awesome Star!', tokenId, {from: accounts[0]})
    assert.equal(await instance.tokenIdToStarInfo.call(tokenId), 'Awesome Star!')
});

it('lets user put up their star for sale', async() => {
    let instance = await StarNotary.deployed();    
    let user1 = accounts[1];        
    let starId = 2;
    let starPrice = web3.utils.toWei(".01", "ether");
    await instance.createStar('awesome star', starId, {from: user1});
    await instance.putStarUpForSale(starId, starPrice, {from: user1});
    assert.equal(await instance.starsForSale.call(starId), starPrice);
});

it('lets user1 get the funds after the sale', async() => {
    let instance = await StarNotary.deployed();
    let user1 = accounts[1];
    let user2 = accounts[2];
    let starId = 3;
    let starPrice = web3.utils.toWei(".01", "ether");
    let balance = web3.utils.toWei(".05", "ether");
    await instance.createStar("awesome star", starId, { from: user1 }); //creation of star 
    await instance.putStarUpForSale(starId, starPrice, { from: user1 }); // put for sale 
    let balanceOfUser1BeforeTransaction = await web3.eth.getBalance(user1); //balance of user 
    //requires that the caller is the owner or approved to transfer that token. `user2` 
    //is not the token owner so it has to be approved.
    await instance.approve(user2, starId, {from: user1, gasPrice: 0})
    await instance.buyStar(starId, { from: user2, value: balance, gasPrice: 0});
    let balanceOfUser1AfterTransaction = await web3.eth.getBalance(user1);
    //Check that the funds were transmitted
    let value1 = Number(balanceOfUser1BeforeTransaction) + Number(starPrice);
    let value2 = Number(balanceOfUser1AfterTransaction);
    assert.equal(value1, value2);   
});

it('lets user2 buy a star, if it is put up for sale', async() => {
    let instance = await StarNotary.deployed();
    let user1 = accounts[1];
    let user2 = accounts[2];
    let starId = 4;
    let starPrice = web3.utils.toWei(".01", "ether");
    let balance = web3.utils.toWei(".05", "ether");
    await instance.createStar('awesome star', starId, {from: user1});
    await instance.putStarUpForSale(starId, starPrice, {from: user1});
    //requires that the caller is the owner or approved to transfer that token. `user2` 
    //is not the token owner so it has to be approved.
    await instance.approve(user2, starId, {from: user1, gasPrice: 0})
    await instance.buyStar(starId, {from: user2, value: balance});
    //Check that the star was sold 
    assert.equal(await instance.ownerOf.call(starId), user2);
});

it('lets user2 buy a star and decreases its balance in ether', async() => {
    let instance = await StarNotary.deployed();
    let user1 = accounts[1];
    let user2 = accounts[2];
    let starId = 5;
    let starPrice = web3.utils.toWei(".01", "ether");
    let balance = web3.utils.toWei(".05", "ether");
    await instance.createStar('awesome star', starId, {from: user1});
    await instance.putStarUpForSale(starId, starPrice, {from: user1});
    const balanceOfUser2BeforeTransaction = await web3.eth.getBalance(user2);
    //requires that the caller is the owner or approved to transfer that token. `user2` 
    //is not the token owner so it has to be approved.
    await instance.approve(user2, starId, {from: user1, gasPrice: 0})
    await instance.buyStar(starId, {from: user2, value: balance, gasPrice:0});
    const balanceAfterUser2BuysStar = await web3.eth.getBalance(user2);
    let value = Number(balanceOfUser2BeforeTransaction) - Number(balanceAfterUser2BuysStar);
    //Check that the funds were transmitted
    assert.equal(value, starPrice);
  });