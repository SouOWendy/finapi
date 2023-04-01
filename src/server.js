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

app.listen(3333);