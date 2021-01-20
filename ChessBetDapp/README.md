# Init
Start up truffle development…

    truffle develop

Once it starts up, go ahead and compile the contract

    truffle(develop)> compile

And now deploy to the blockchain

    truffle(develop)> migrate

We now have our contract deployed to our test blockchain. Now, go ahead and open
up a new terminal and navigate to the project root again. Run the following
command to startup the dApp in dev mode to view in your browser.

    npm run dev