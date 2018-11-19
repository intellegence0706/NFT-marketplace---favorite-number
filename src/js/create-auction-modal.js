CreateAuctionM = {
  init: function() {
    console.log('CreateAuctionM init');
    return CreateAuctionM.bindEvents();
  },

  bindEvents: function() {
    $('#createAuctionModal').on('click', '#submitAuction', CreateAuctionM.create);
  },

  create: function(event) {
    event.preventDefault();
    // get values
    let tokenToSell   = parseInt(event.target.getAttribute('data-token-id'));
    let startingPrice = $('#startingPrice').val(); // in ether
    let endingPrice   = $('#endingPrice').val(); // in ether
    let duration      = $('#duration').val(); // in hours
    // convert to wei
    startingPrice = web3.toWei(startingPrice, 'ether');
    endingPrice   = web3.toWei(endingPrice, 'ether');
    // convert from hours to seconds
    duration = duration * 60 * 60;

    if (startingPrice < endingPrice) {
      throw 'error: starting price must be greater than ending price';
    }

    web3.eth.getAccounts(function(error, accounts) {

      if (error) {
        console.log(error);
      }

      let account = accounts[0];
      let approved = false;

      App.contracts.NFTDutchAuction.deployed().then(function(instance) {
        return instance;
      }).then(function(NFTDutchAuction_instance) {

        return App.contracts.NumbersNFT.deployed().then(function(instance) {
          // allow transfer of NFT by NFTDutchAuction contract
          // TODO: before calling .approve(), check if 'tokenToSell' has not been approved already 
          console.log('tokenToSell: ' + tokenToSell);
          return instance.approve(NFTDutchAuction_instance.address, tokenToSell, {from: account});
        }).then(function(result) {
          // mark first step as completed
          $('#progress ol li:first-child > .step-completed').show();
          $('#progress ol li:first-child').addClass('step-completed');
          $('#submitAuction').text('Start auction');
          approved = true;
        }).catch(function(err) {
          console.error(err.message);
        });

      }).then(function(NFTDutchAuction_instance) {
        // TODO: there has to be a prettier way to do this
        if (approved) {
          // create auction
          App.contracts.NFTDutchAuction.deployed().then(function(instance) {
            /*
            console.log('-> idTokenToSell: ' + tokenToSell);
            console.log('-> startingPrice: ' + startingPrice + ' wei');
            console.log('-> endingPrice: '   + endingPrice + ' wei');
            console.log('-> duration: '      + duration + ' seconds');
            */
            tokenToSell   = parseInt(tokenToSell);
            startingPrice = parseInt(startingPrice);
            endingPrice   = parseInt(endingPrice);
            duration      = parseInt(duration);
            /*
            function createAuction(
              uint256 _tokenId, uint256 _startingPrice,
              uint256 _endingPrice, uint256 _duration
            )
            */
            console.log('calling NFTDutchAuction.createAuction()');
            return instance.createAuction(
              tokenToSell,
              startingPrice,
              endingPrice,
              duration,
              {from: account}
            );
          }).then(function(result) {
            // mark second step as completed
            $('#progress ol li:last-child > .step-completed').show();
            $('#progress ol li:last-child').addClass('step-completed');
            return $('#createAuctionModal').modal('hide');
          });
        } // if approved
      }).catch(function(err) {
        console.error(err.message);
      });

    }); // web3.eth.getAccounts
  },

}

$(function() {
  $(window).load(function() {
    CreateAuctionM.init();
  });
});
