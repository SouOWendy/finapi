const express = require("express");
const { send } = require("process");
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
    return res.status(400).json({error: "Balance is not sufficient."})
  
  account.statement.push({
    type: "debit",
    amount,
    createdAt: new Date()
  });

  return res.status(200).send();
})

app.get("/statement/date", checkAccountCPF, (req, res) => { // Show Bank Statement by Date
  const { account } = req;
  const { date } = req.query;
  
  const statement = account.statement.filter(statement => statement.createdAt.toDateString() === new Date(date).toDateString());

  return res.json(statement);
});

app.put("/account", checkAccountCPF, (req, res) => { // Update account
  const { account } = req;
  const { name } = req.body;

  account.name = name;

  return res.status(201).send();
});

app.get("/account", checkAccountCPF, (req, res) => { // Show account info
  const { account } = req;

  return res.json(account);  
});

app.delete("/account", checkAccountCPF, (req, res) => { // Delete accont
  const { account } = req;

  accounts.splice(account, 1);

  return res.status(201).send();
});

app.get("/balance", checkAccountCPF, (req, res) => {
  const { account } = req;
  const balance = getBalance(account.statement);
  return res.json({balance});
});

app.listen(3333);