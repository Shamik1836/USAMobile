
  /* 
  it(`2. First mint should mint 56484 tokens  `, async function () {  
    await testMinting("first", 56484, 402793, accounts[2], 1);
    confirmMint(0, 56484);    
  });  
  
  it(`3. Second mint should mint 65994 tokens  `, async function () {  
    await testMinting("second", 65994, 1491065, accounts[3], 1);
    confirmMint(56484, 65994);    
  }); 

  it(`4. First burn should burn 11766 tokens  `, async function () {  
    await testBurning("first", 11766, accounts[3]);
    confirmBurn(122478, 11766);  
  });  
  */

  

  

  /*
  it(`BigBrainPrep `, async function () {  

    

    /*
    await mockUSDCTokenContract.connect(accounts[5]).getmockUSDC(); 

    const acc5MockUSDCBalanceAfterGetting10MStart = fromWEItoUSDC( bigNumberToNumber (await mockUSDCTokenContract.balanceOf(accounts[5].address)) );
    console.log('acc5MockUSDCBalanceAfterBigMint', acc5MockUSDCBalanceAfterGetting10MStart);   
    
  }); */



 


  /*
  it(`BigBrainTest 1. 10 loops  `, async function () {  
    
    await waitFor(5000);
    await runMintOrBurnLoop(10) 
   

  });  
  /*
  it(`BigBrainTest 2. 100 loops  `, async function () {  
    
    await waitFor(5000);
    await runMintOrBurnLoop(100) 
  });  

  it(`BigBrainTest 3. 100 loops  `, async function () {  
    
    await waitFor(5000);
    await runMintOrBurnLoop(100) 

  });  
  
  it(`BigBrainTest 4. 100 loops  `, async function () {  
    
    await waitFor(5000);
    await runMintOrBurnLoop(100) 

  });  

  it(`BigBrainTest 5. 100 loops  `, async function () {  
    
    await waitFor(5000);
    await runMintOrBurnLoop(100) 

  });  

  it(`BigBrainTest 6. 100 loops  `, async function () {  
    
    await waitFor(5000);
    await runMintOrBurnLoop(100) 

  });  

  it(`BigBrainTest 7. 100 loops  `, async function () {  
    
    await waitFor(5000);
    await runMintOrBurnLoop(100) 

  });  

  it(`BigBrainTest 8. 100 loops  `, async function () {  
    
    await waitFor(5000);
    await runMintOrBurnLoop(100) 

  });  

  it(`BigBrainTest 9. 100 loops  `, async function () {  
    
    await waitFor(5000);
    await runMintOrBurnLoop(100) 

  });  

  it(`BigBrainTest 10. 100 loops  `, async function () {  
    
    await waitFor(5000);
    await runMintOrBurnLoop(100) 

  });  */



/*
  it(`BigBrainTest3: User should burn all tokens that he has at the end`, async function () {  

    const callingAccEndTokenBalance = bigNumberToNumber( await ourTokenContract.balanceOf(accounts[5].address) );
    console.log('at the end of the test, acc 5 has this many tokens:', callingAccEndTokenBalance);

    await testBurning("burnAll", callingAccEndTokenBalance, accounts[5]);

    const protocolBalanceAfterBurnAll = fromWEItoUSDC( bigNumberToNumber (await mockUSDCTokenContract.balanceOf(ourTokenContract.address)) );
    console.log('after burning all tokens, protocol USDC balance:', protocolBalanceAfterBurnAll);
    
    const acc5MockUSDCBalanceAfterBurnAll = fromWEItoUSDC( bigNumberToNumber (await mockUSDCTokenContract.balanceOf(accounts[5].address)) );
    console.log('after burning all tokens, acc5 user USDC balance', acc5MockUSDCBalanceAfterBurnAll);
    
    const feeReceiveracc1MockUSDCBalanceAfterBurnAll = fromWEItoUSDC( bigNumberToNumber (await mockUSDCTokenContract.balanceOf(accounts[1].address)) );
    console.log('after burning all tokens, feeReceiver user USDC balance', feeReceiveracc1MockUSDCBalanceAfterBurnAll);

    const inTotalUSDCExistafterBurnAll = (Number(protocolBalanceAfterBurnAll*100) + Number(acc5MockUSDCBalanceAfterBurnAll*100) + Number(feeReceiveracc1MockUSDCBalanceAfterBurnAll*100)) / 100 ; 
    console.log('after burning all tokens, total USDC exist:', inTotalUSDCExistafterBurnAll); 
  });
  */

  /*
    it(`0 temp. Testing withdraw accumulated  `, async function () { 
      
      const testAcc4MockUSDCBalanceStart = bigNumberToNumber (await mockUSDCTokenContract.balanceOf(accounts[4].address));
      console.log('testAcc4MockUSDCBalanceStart', testAcc4MockUSDCBalanceStart);

      await mockUSDCTokenContract.connect(accounts[4]).getmockUSDC();
      const testAcc4MockUSDCBalanceAfterGet = bigNumberToNumber (await mockUSDCTokenContract.balanceOf(accounts[4].address));
      console.log('testAcc4MockUSDCBalanceAfterGet', testAcc4MockUSDCBalanceAfterGet);

      await mockUSDCTokenContract.connect(accounts[4]).transfer(ourTokenContract.address, testAcc4MockUSDCBalanceAfterGet);
      const testAcc4MockUSDCBalanceAfterSend = bigNumberToNumber (await mockUSDCTokenContract.balanceOf(accounts[4].address));    
      const testContractMockUSDCBalanceAfterGet = bigNumberToNumber (await mockUSDCTokenContract.balanceOf(ourTokenContract.address));
      console.log('testAcc4MockUSDCBalanceAfterSend', testAcc4MockUSDCBalanceAfterSend);
      console.log('testContractMockUSDCBalanceAfterGet', testContractMockUSDCBalanceAfterGet);

      const testAcc0MockUSDCBalanceShouldBeEmpty = bigNumberToNumber (await mockUSDCTokenContract.balanceOf(accounts[0].address));
      console.log('testAcc0MockUSDCBalanceShouldBeEmpty', testAcc0MockUSDCBalanceShouldBeEmpty);

      await ourTokenContract.withdrawERC20(mockUSDCTokenContract.address);
      const testContractMockUSDCBalanceAfterWithdraw = bigNumberToNumber (await mockUSDCTokenContract.balanceOf(ourTokenContract.address));
      console.log('testContractMockUSDCBalanceAfterWithdraw', testContractMockUSDCBalanceAfterWithdraw);

      const testAcc0MockUSDCBalanceAfterWithdraw = bigNumberToNumber (await mockUSDCTokenContract.balanceOf(accounts[0].address));
      console.log('testAcc0MockUSDCBalanceAfterWithdraw', testAcc0MockUSDCBalanceAfterWithdraw);     
    });  
  */ 


    // older, snippets