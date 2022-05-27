var Election = artifacts.require('./Election.sol');

contract ("Election", function(accounts){
    var myinst;
    it("initializes two candidates", function(){
        return Election.deployed().then(function(instance){
            return instance.candidatesCount();
        }).then(function(count){
            assert.equal(count, 2);
        });
    });

    it("checks both the candidate details", function(){
        return Election.deployed()
        .then(function(instance){
            myinst = instance;
            return myinst.candidates(1);
        })
        .then(function(candidate){
            assert.equal(candidate[0], 1, "contains correct id");
            assert.equal(candidate[1], "Candidate 1", "contains correct name");
            assert.equal(candidate[2], 0, "contains correct voteCount");
            return myinst.candidates(2);
        })
        .then(function(candidate){
            assert.equal(candidate[0], 2, "contains correct id");
            assert.equal(candidate[1], "Candidate 2", "contains correct name");
            assert.equal(candidate[2], 0, "contains correct voteCount");
        });
    });

    it("tests vote functinality", function(){
        return Election.deployed()
        .then(function(instance){
            myinst = instance;
            candidateId = 1;
            return myinst.vote(candidateId, { from : accounts[0]});
        })
        .then(function(receipt){
            assert.equal(receipt.logs.length, 1, "an event was triggered");
            assert.equal(receipt.logs[0].event, "votedEvent", "the event type is correct");
            assert.equal(receipt.logs[0].args._candidateId.toNumber(), candidateId, "the candidate id is correct");
            return myinst.voters(accounts[0]);
        })
        .then(function(voted){
            assert(voted, "vote casted by account[0]");
            return myinst.candidates(candidateId);
        })
        .then(function(candidate){
            voteCount = candidate.voteCount;    
            assert.equal(voteCount, 1, "candidates vote count incremented ")
        })
    });

    it("tests casting vote to unavailable candidate", function(){
        return Election.deployed()
        .then(function(instance){
            myinst = instance;
            return myinst.vote(99, { from : accounts[0]});
        })
        .then(assert.fail)
        .catch(function(error){
            assert(error.message.indexOf('revert') >= 0, "error must contain revert");
            return myinst.candidates(1);
        })
        .then(function(candidate){
            assert.equal(candidate.voteCount, 1, "candidate 1 should have 1 vote");
            return myinst.candidates(2);
        })
        .then(function(candidate){
            assert.equal(candidate.voteCount, 0, "candidate 2 should have 0 vote");
        })
    });

    it("tests double voting", function(){
        return Election.deployed()
        .then(function(instance){
            myinst = instance;
            candidateId = 2;
            myinst.vote(2, { from : accounts[1] });
            return myinst.candidates(candidateId);
        })
        .then(function(candidate){
            assert.equal(candidate.voteCount, 1, "candidate 2 shoud have been voted from account[1]");

            return myinst.vote(candidateId, { from : accounts[1] });
        })
        .then(assert.fail)
        .catch(function(error){
            assert(error.message.indexOf('revert') >= 0, "tx should have been reverted");
            return myinst.candidates(1);
        })
        .then(function(candidate){
            assert.equal(candidate.voteCount, 1, "cand 1 should have 1 vote");
            return myinst.candidates(2);
        })
        .then(function(candidate){
            assert.equal(candidate.voteCount, 1, "cand 2 should have 1 vote");
        })
    });
});