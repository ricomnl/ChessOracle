import React, { Component } from "react";
import Bet from "../build/contracts/Bet.json";
import getWeb3 from "./utils/getWeb3";

import BetComponent from './component/Bet';

import "./css/oswald.css";
import "./css/open-sans.css";
import "./css/pure-min.css";
import "./App.css";

const contract = require("truffle-contract");
const chessBet = contract(Bet);

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      bet: {},
      loading: true,
      error: null,
      web3: null,
    };
  }

  componentWillMount() {
    getWeb3
      .then(results => {
        this.setState({
          web3: results.web3,
        });
        chessBet.setProvider(this.state.web3.currentProvider);
        this.state.web3.version.getNetwork(function (err, res) { console.log("network:" + res) });
        this.getBet();
      })
      .catch((error => {
        console.log("Error:" + JSON.stringify(error))
        this.setState({error: "Chess Bet Error", loading: false});
      }));
  }

  getAccount() {
    if (this.state.web3) {
      return this.state.web3.eth.accounts[0];
    } else { return ""; }
  }

  populateBetFromEvent(result) {

    //MetaMask events not reliable
    //https://github.com/MetaMask/metamask-extension/issues/2393
    //just using logs
    const logs = result.logs;
    if (logs) {
      logs.forEach((log) => {
        if (log.event === "BetStatus") {
          const event = log.args;
          this.setState({
            loading: false,
            bet: {
              gameStatus: Number(event.gameStatus),
              originator: event.originatorAddress,
              originatorGuess: Number(event.originatorGuess),
              originatorStatus: Number(event.originatorStatus),
              taker: event.takerAddress,
              takerGuess: Number(event.takerGuess),
              takerStatus: Number(event.takerStatus),
              betAmount: this.state.web3.fromWei(event.betAmount),
              actualNumber: Number(event.actualNumber),
              pot: this.state.web3.fromWei(event.pot)
            }
          });
        }
      })
    } else {
      this.setState({error: "Chess Bet Error", loading: false});
    }
  }

  getBet() {
    chessBet
      .deployed()
      .then(instance => {
        instance.getBetOutcome({ from: this.getAccount() }).then(result => {
          this.populateBetFromEvent(result)
        })
          .catch((error => {
            console.log("Error:" + JSON.stringify(error))
            this.setState({error: "Chess Bet Error", loading: false});
          }));
      });
  }

  placeBet(guess, amount) {
    this.setState({loading: true});
    chessBet
      .deployed()
      .then(instance => {
        return instance.createBet(guess, { from: this.getAccount(), value: this.state.web3.toWei(amount, "ether") });
      })
      .then(result => {
        this.populateBetFromEvent(result);
      })
      .catch((error => {
        console.log("Error:" + JSON.stringify(error))
        this.setState({error: "Chess Bet Error", loading: false});
      }));
  }

  takeBet(guess) {
    this.setState({loading: true});
    chessBet
      .deployed()
      .then(instance => {
        return instance.takeBet(guess, { from: this.getAccount(), value: this.state.web3.toWei(this.state.bet.betAmount, "ether") });
      })
      .then(result => {
        this.populateBetFromEvent(result);
      })
      .catch((error => {
        console.log("Error:" + JSON.stringify(error))
        this.setState({error: "Chess Bet Error", loading: false});
      }));
  }

  payoutBet() {
    this.setState({loading: true});
    chessBet
      .deployed()
      .then(instance => {
        return instance.payout({ from: this.getAccount(), gas: 300000 });
      })
      .then(result => {
        this.populateBetFromEvent(result);
      })
      .catch((error => {
        console.log("Error:" + JSON.stringify(error))
        this.setState({error: "Chess Bet Error", loading: false});
      }));
  }


  render() {

    return (
      <div className="App" >
        <nav className="navbar pure-menu pure-menu-horizontal">
          <a href="#" className="pure-menu-heading pure-menu-link">
            Chess Bet
          </a>
        </nav>

        <main className="container">
          <div className="pure-g">
            <div className="pure-u-1-1">
              <h1>The Queens Gamble</h1>
              <p>
                The Chess Bet smart contract will generate a secret number between 1 and 3.
                <br />The gamblers then attempt to guess the number without going over it and place bets accordingly.
              </p>
              <BetComponent
                account={this.getAccount()}
                bet={this.state.bet}
                loading={this.state.loading}
                error={this.state.error}
                placeBet={(guess, amount) => { this.placeBet(guess, amount) }}
                takeBet={(guess) => { this.takeBet(guess) }}
                payoutBet={() => { this.payoutBet() }}
              />
            </div>
          </div>
        </main>
      </div>
    );
  }
}

export default App;
