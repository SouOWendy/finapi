const express = require("express");
const {v4: uuidv4} = require("uuid");

const app = express();

const accounts = []; // Structure

function checkAccountCPF(req, res, next) { // Check exists CPF in header
  const { cpf } = req.headers;

  const account = accounts.find(account => account.cpf === cpf)

  if (!account)
    return res.status(400).json({error : "Account not exists"});
  
  req.account = account;
  return next();
}

function getBalance(statement) { // Calculate the balance
  const total = statement.reduce((acc, currentValue) => {
    if (currentValue.type === "credit")
      return acc + currentValue.amount;
    else
      return acc - currentValue.amount;
  }, 0);

  return total;
}

app.use(express.json()); // Use JSON

app.get("/accounts", (req, res) => { // List all accounts
  return res.json(accounts);
});

app.post("/account", (req, res) => { // Create Account
  const { name, cpf } = req.body;

  const accountAlreadyExists = accounts.some(account => account.cpf === cpf);
  if (accountAlreadyExists)
    return res.status(400).json({error: "CPF already used!"})

  const account = {
    name,
    cpf,
    id: uuidv4(),
    statement: []
  };

  accounts.push(account);

  return res.status(201).send();
});

app.get("/statement", checkAccountCPF, (req, res) => { // Show Bank Statement
  return res.status(200).json(req.account.statement);
});

app.post("/deposit", checkAccountCPF, (req, res) => { // Make deposit
  const { account } = req;
  const { description, amount } = req.body;

  account.statement.push({
    type: "credit",
    description,
    amount,
    createdAt: new Date()
  });

  return res.status(200).send();
});

app.post("/withdraw", checkAccountCPF, (req, res) => { // Make withdraw
  const { account } = req;
  const { amount } = req.body;
  
  if (getBalance(account.statement) < amount)
    res.status(400).json({error: "Balance is not sufficient."})
  
  account.statement.push({
    type: "debit",
    amount,
    createdAt: new Date()
  });

  res.status(200).send();
})

app.listen(3333);