const express = require("express")
const bodyParser = require("body-parser")
const fs = require("fs")
const path = require("path")
const jwt = require("jsonwebtoken")
const bcrypt = require("bcryptjs")
const { v4: uuidv4 } = require("uuid")

const app = express()
const PORT = process.env.PORT || 3000
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

// Middleware
app.use(bodyParser.json())
app.use(express.static(path.join(__dirname)))

// Helper functions for file operations
function readJSONFile(filePath) {
  try {
    const data = fs.readFileSync(filePath)
    return JSON.parse(data)
  } catch (error) {
    // If file doesn't exist, return empty array
    return []
  }
}

function writeJSONFile(filePath, data) {
  const dirPath = path.dirname(filePath)
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true })
  }
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2))
}

// File paths
const USERS_FILE = path.join(__dirname, "data", "users.json")
const TRANSACTIONS_FILE = path.join(__dirname, "data", "transactions.json")
const WALLETS_FILE = path.join(__dirname, "data", "wallets.json")
const TOKENS_FILE = path.join(__dirname, "data", "tokens.json")
const CRYPTO_WALLETS_FILE = path.join(__dirname, "data", "crypto-wallets.json")

// Ensure data directory exists
if (!fs.existsSync(path.join(__dirname, "data"))) {
  fs.mkdirSync(path.join(__dirname, "data"))
}

// Initialize files if they don't exist
if (!fs.existsSync(USERS_FILE)) {
  // Create admin user
  const adminUser = {
    id: uuidv4(),
    name: "Admin User",
    email: "admin@example.com",
    password: bcrypt.hashSync("admin123", 10),
    balance: 5000000000.0,
    isAdmin: true,
    status: "active",
    createdAt: new Date().toISOString(),
    mainWalletAddress: generateWalletAddress("main"),
    trxWalletAddress: generateWalletAddress("trx"),
    usdtWalletAddress: generateWalletAddress("usdt"),
    usdcWalletAddress: generateWalletAddress("usdc"),
    trxBalance: 5000000000.0,
    usdtBalance: 5000000000.0,
    usdcBalance: 5000000000.0,
  }
  writeJSONFile(USERS_FILE, [adminUser])
}

if (!fs.existsSync(TRANSACTIONS_FILE)) {
  writeJSONFile(TRANSACTIONS_FILE, [])
}

if (!fs.existsSync(WALLETS_FILE)) {
  writeJSONFile(WALLETS_FILE, [])
}

if (!fs.existsSync(CRYPTO_WALLETS_FILE)) {
  writeJSONFile(CRYPTO_WALLETS_FILE, [])
}

if (!fs.existsSync(TOKENS_FILE)) {
  writeJSONFile(TOKENS_FILE, [])
}

// Authentication middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"]
  const token = authHeader && authHeader.split(" ")[1]

  if (!token) {
    return res.status(401).json({ success: false, message: "Access denied" })
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, message: "Invalid or expired token" })
    }

    req.user = user
    next()
  })
}

// Admin middleware
function isAdmin(req, res, next) {
  if (!req.user.isAdmin) {
    return res.status(403).json({ success: false, message: "Admin access required" })
  }
  next()
}

// Helper function to generate wallet address
function generateWalletAddress(tokenType) {
  const chars = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"
  let result = ""
  for (let i = 0; i < 34; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return `${tokenType}_${result}` // Prefix with token type for uniqueness
}

// Routes

// Auth routes
app.post("/api/auth/register", (req, res) => {
  const { name, email, password } = req.body

  // Validate input
  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: "All fields are required" })
  }

  // Check if email already exists
  const users = readJSONFile(USERS_FILE)
  if (users.some((user) => user.email === email)) {
    return res.status(400).json({ success: false, message: "Email already in use" })
  }

  // Create new user with all wallets initialized to 0
  const newUser = {
    id: uuidv4(),
    name,
    email,
    password: bcrypt.hashSync(password, 10),
    balance: 0,
    isAdmin: false,
    status: "active",
    createdAt: new Date().toISOString(),
    mainWalletAddress: generateWalletAddress("main"),
    trxWalletAddress: generateWalletAddress("trx"),
    usdtWalletAddress: generateWalletAddress("usdt"),
    usdcWalletAddress: generateWalletAddress("usdc"),
    trxBalance: 0,
    usdtBalance: 0,
    usdcBalance: 0,
  }

  // Add user to file
  users.push(newUser)
  writeJSONFile(USERS_FILE, users)

  // Create token
  const token = jwt.sign({ id: newUser.id, email: newUser.email, isAdmin: newUser.isAdmin }, JWT_SECRET, {
    expiresIn: "24h",
  })

  // Return user data (without password)
  const { password: _, ...userWithoutPassword } = newUser
  res.status(201).json({ success: true, user: userWithoutPassword, token })
})

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body

  // Validate input
  if (!email || !password) {
    return res.status(400).json({ success: false, message: "Email and password are required" })
  }

  // Find user
  const users = readJSONFile(USERS_FILE)
  const user = users.find((user) => user.email === email)

  // Check if user exists and password is correct
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ success: false, message: "Invalid email or password" })
  }

  // Create token
  const token = jwt.sign({ id: user.id, email: user.email, isAdmin: user.isAdmin }, JWT_SECRET, { expiresIn: "24h" })

  // Return user data (without password)
  const { password: _, ...userWithoutPassword } = user
  res.json({ success: true, user: userWithoutPassword, token })
})

// User routes
app.get("/api/users/balance", authenticateToken, (req, res) => {
  const users = readJSONFile(USERS_FILE)
  const user = users.find((user) => user.id === req.user.id)

  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" })
  }

  res.json({ success: true, balance: user.balance })
})

app.get("/api/users/tokens", authenticateToken, (req, res) => {
  const userId = req.user.id
  const users = readJSONFile(USERS_FILE)
  const user = users.find((user) => user.id === userId)

  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" })
  }

  const tokens = [
    { symbol: "TRX", name: "TRON", balance: user.trxBalance, price: 0.2517, change: 0.06 },
    { symbol: "USDT", name: "Tether", balance: user.usdtBalance, price: 1.0, change: 0.0 },
    { symbol: "USDC", name: "USD Coin", balance: user.usdcBalance, price: 1.01, change: 42.81 },
  ]

  res.json({ success: true, tokens })
})

app.put("/api/users/profile", authenticateToken, (req, res) => {
  const { name } = req.body
  const userId = req.user.id

  // Validate input
  if (!name) {
    return res.status(400).json({ success: false, message: "Name is required" })
  }

  // Get users
  const users = readJSONFile(USERS_FILE)
  const userIndex = users.findIndex((user) => user.id === userId)

  if (userIndex === -1) {
    return res.status(404).json({ success: false, message: "User not found" })
  }

  // Update user
  users[userIndex].name = name

  // Save updated users
  writeJSONFile(USERS_FILE, users)

  res.json({ success: true, message: "Profile updated successfully" })
})

app.put("/api/users/change-password", authenticateToken, (req, res) => {
  const { currentPassword, newPassword } = req.body
  const userId = req.user.id

  // Validate input
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ success: false, message: "Current password and new password are required" })
  }

  // Get users
  const users = readJSONFile(USERS_FILE)
  const userIndex = users.findIndex((user) => user.id === userId)

  if (userIndex === -1) {
    return res.status(404).json({ success: false, message: "User not found" })
  }

  // Verify current password
  if (!bcrypt.compareSync(currentPassword, users[userIndex].password)) {
    return res.status(400).json({ success: false, message: "Current password is incorrect" })
  }

  // Update password
  users[userIndex].password = bcrypt.hashSync(newPassword, 10)

  // Save updated users
  writeJSONFile(USERS_FILE, users)

  res.json({ success: true, message: "Password changed successfully" })
})

// Transaction routes
app.get("/api/transactions", authenticateToken, (req, res) => {
  const transactions = readJSONFile(TRANSACTIONS_FILE)
  const userId = req.user.id

  // Filter transactions for current user
  const userTransactions = transactions.filter(
    (transaction) =>
      (transaction.fromUserId === userId || transaction.toUserId === userId) &&
      (transaction.type !== "admin-funding" || transaction.toUserId === userId),
  )

  // Format transactions for response
  const formattedTransactions = userTransactions.map((transaction) => {
    const isReceived = transaction.toUserId === userId

    return {
      id: transaction.id,
      type: isReceived ? "received" : "sent",
      amount: transaction.amount,
      from: transaction.fromName,
      to: transaction.toName,
      date: transaction.createdAt,
      status: transaction.status,
      note: transaction.note,
    }
  })

  res.json({ success: true, transactions: formattedTransactions })
})

app.post("/api/transactions/send", authenticateToken, (req, res) => {
  const { recipientAddress, amount, tokenType, note } = req.body
  const senderId = req.user.id

  // Validate input
  if (!recipientAddress || !amount || amount <= 0 || !tokenType) {
    return res
      .status(400)
      .json({ success: false, message: "Valid recipient address, amount, and token type are required" })
  }

  // Get users
  const users = readJSONFile(USERS_FILE)
  const sender = users.find((user) => user.id === senderId)

  // Find recipient by wallet address based on token type
  let recipient
  switch (tokenType) {
    case "TRX":
      recipient = users.find((user) => user.trxWalletAddress === recipientAddress)
      break
    case "USDT":
      recipient = users.find((user) => user.usdtWalletAddress === recipientAddress)
      break
    case "USDC":
      recipient = users.find((user) => user.usdcWalletAddress === recipientAddress)
      break
    default:
      return res.status(400).json({ success: false, message: "Invalid token type" })
  }

  // Check if recipient exists
  if (!recipient) {
    return res.status(404).json({ success: false, message: "Recipient not found" })
  }

  let senderBalanceField, recipientBalanceField
  switch (tokenType) {
    case "TRX":
      senderBalanceField = "trxBalance"
      recipientBalanceField = "trxBalance"
      break
    case "USDT":
      senderBalanceField = "usdtBalance"
      recipientBalanceField = "usdtBalance"
      break
    case "USDC":
      senderBalanceField = "usdcBalance"
      recipientBalanceField = "usdcBalance"
      break
    default:
      return res.status(400).json({ success: false, message: "Invalid token type" })
  }

  // Check if sender has enough balance
  if (sender[senderBalanceField] < amount) {
    return res.status(400).json({ success: false, message: "Insufficient balance" })
  }

  // Update balances
  sender[senderBalanceField] -= amount
  recipient[recipientBalanceField] += amount

  // Save updated users
  writeJSONFile(USERS_FILE, users)

  // Create transaction record
  const transactions = readJSONFile(TRANSACTIONS_FILE)
  const newTransaction = {
    id: uuidv4(),
    type: "transfer",
    amount,
    tokenType,
    fromUserId: sender.id,
    toUserId: recipient.id,
    fromName: sender.name,
    toName: recipient.name,
    toAddress: recipientAddress,
    note: note || "",
    status: "completed",
    createdAt: new Date().toISOString(),
  }

  transactions.push(newTransaction)
  writeJSONFile(TRANSACTIONS_FILE, transactions)

  res.json({ success: true, message: "Transfer successful", transactionId: newTransaction.id })
})

// Add this new endpoint after the existing send endpoint
app.post("/api/transactions/send-main", authenticateToken, (req, res) => {
  const { recipientAddress, amount, note } = req.body
  const senderId = req.user.id

  // Validate input
  if (!recipientAddress || !amount || amount <= 0) {
    return res.status(400).json({ success: false, message: "Valid recipient address and amount are required" })
  }

  // Get users
  const users = readJSONFile(USERS_FILE)
  const sender = users.find((user) => user.id === senderId)

  // Find recipient by main wallet address
  const recipient = users.find((user) => user.mainWalletAddress === recipientAddress)

  // Check if recipient exists
  if (!recipient) {
    return res.status(404).json({ success: false, message: "Recipient not found" })
  }

  // Check if sender has enough balance
  if (sender.balance < amount) {
    return res.status(400).json({ success: false, message: "Insufficient balance" })
  }

  // Update balances
  sender.balance -= amount
  recipient.balance += amount

  // Save updated users
  writeJSONFile(USERS_FILE, users)

  // Create transaction record
  const transactions = readJSONFile(TRANSACTIONS_FILE)
  const newTransaction = {
    id: uuidv4(),
    type: "main-to-main",
    amount,
    tokenType: "MAIN",
    fromUserId: sender.id,
    toUserId: recipient.id,
    fromName: sender.name,
    toName: recipient.name,
    fromAddress: sender.mainWalletAddress,
    toAddress: recipientAddress,
    note: note || "",
    status: "completed",
    createdAt: new Date().toISOString(),
  }

  transactions.push(newTransaction)
  writeJSONFile(TRANSACTIONS_FILE, transactions)

  res.json({ success: true, message: "Transfer successful", transactionId: newTransaction.id })
})

app.post("/api/admin/fund-user", authenticateToken, isAdmin, (req, res) => {
  const { recipientAddress, amount, tokenType } = req.body
  const adminId = req.user.id

  // Validate input
  if (!recipientAddress || !amount || amount <= 0 || !tokenType) {
    return res
      .status(400)
      .json({ success: false, message: "Valid recipient address, amount, and token type are required" })
  }

  // Get users
  const users = readJSONFile(USERS_FILE)
  const admin = users.find((user) => user.id === adminId)
  const recipient = users.find(
    (user) =>
      user.trxWalletAddress === recipientAddress ||
      user.usdtWalletAddress === recipientAddress ||
      user.usdcWalletAddress === recipientAddress,
  )

  // Check if recipient exists
  if (!recipient) {
    return res.status(404).json({ success: false, message: "Recipient not found" })
  }

  let adminBalanceField, recipientBalanceField
  switch (tokenType) {
    case "TRX":
      adminBalanceField = "trxBalance"
      recipientBalanceField = "trxBalance"
      break
    case "USDT":
      adminBalanceField = "usdtBalance"
      recipientBalanceField = "usdtBalance"
      break
    case "USDC":
      adminBalanceField = "usdcBalance"
      recipientBalanceField = "usdcBalance"
      break
    default:
      return res.status(400).json({ success: false, message: "Invalid token type" })
  }

  // Check if admin has enough balance
  if (admin[adminBalanceField] < amount) {
    return res.status(400).json({ success: false, message: "Insufficient admin balance" })
  }

  // Update balances
  admin[adminBalanceField] -= amount
  recipient[recipientBalanceField] += amount

  // Save updated users
  writeJSONFile(USERS_FILE, users)

  // Create transaction record
  const transactions = readJSONFile(TRANSACTIONS_FILE)
  const newTransaction = {
    id: uuidv4(),
    type: "admin-funding",
    amount,
    tokenType,
    fromUserId: admin.id,
    toUserId: recipient.id,
    fromName: "Admin",
    toName: recipient.name,
    toAddress: recipientAddress,
    note: "Admin funding",
    status: "completed",
    createdAt: new Date().toISOString(),
  }

  transactions.push(newTransaction)
  writeJSONFile(TRANSACTIONS_FILE, transactions)

  res.json({ success: true, message: "User funded successfully" })
})

app.post("/api/admin/fund-main-account", authenticateToken, isAdmin, (req, res) => {
  const { recipientAddress, amount } = req.body
  const adminId = req.user.id

  // Validate input
  if (!recipientAddress || !amount || amount <= 0) {
    return res.status(400).json({ success: false, message: "Valid recipient address and amount are required" })
  }

  // Get users
  const users = readJSONFile(USERS_FILE)
  const admin = users.find((user) => user.id === adminId)
  const recipient = users.find((user) => user.mainWalletAddress === recipientAddress)

  // Check if recipient exists
  if (!recipient) {
    return res.status(404).json({ success: false, message: "Recipient not found" })
  }

  // Check if admin has enough balance
  if (admin.balance < amount) {
    return res.status(400).json({ success: false, message: "Insufficient admin balance" })
  }

  // Update balances
  admin.balance -= amount
  recipient.balance += amount

  // Save updated users
  writeJSONFile(USERS_FILE, users)

  // Create transaction record
  const transactions = readJSONFile(TRANSACTIONS_FILE)
  const newTransaction = {
    id: uuidv4(),
    type: "admin-funding-main",
    amount,
    tokenType: "MAIN",
    fromUserId: admin.id,
    toUserId: recipient.id,
    fromName: "Admin",
    toName: recipient.name,
    toAddress: recipientAddress,
    note: "Admin funding main account",
    status: "completed",
    createdAt: new Date().toISOString(),
  }

  transactions.push(newTransaction)
  writeJSONFile(TRANSACTIONS_FILE, transactions)

  res.json({ success: true, message: "User main account funded successfully" })
})

// Add a new route for funding token wallets from main wallet
app.post("/api/transactions/fund-token", authenticateToken, (req, res) => {
  const { tokenType, amount } = req.body
  const userId = req.user.id

  // Validate input
  if (!tokenType || !amount || amount <= 0) {
    return res.status(400).json({ success: false, message: "Valid token type and amount are required" })
  }

  // Get users
  const users = readJSONFile(USERS_FILE)
  const userIndex = users.findIndex((user) => user.id === userId)

  if (userIndex === -1) {
    return res.status(404).json({ success: false, message: "User not found" })
  }

  const user = users[userIndex]

  // Check if user has enough balance in main wallet
  if (user.balance < amount) {
    return res.status(400).json({ success: false, message: "Insufficient balance in main wallet" })
  }

  // Determine which token balance to update
  let tokenBalanceField
  switch (tokenType) {
    case "TRX":
      tokenBalanceField = "trxBalance"
      break
    case "USDT":
      tokenBalanceField = "usdtBalance"
      break
    case "USDC":
      tokenBalanceField = "usdcBalance"
      break
    default:
      return res.status(400).json({ success: false, message: "Invalid token type" })
  }

  // Update balances
  user.balance -= amount
  user[tokenBalanceField] += amount

  // Save updated users
  writeJSONFile(USERS_FILE, users)

  // Create transaction record
  const transactions = readJSONFile(TRANSACTIONS_FILE)
  const newTransaction = {
    id: uuidv4(),
    type: "main-to-token",
    amount,
    tokenType,
    fromUserId: user.id,
    toUserId: user.id,
    fromName: user.name,
    toName: user.name,
    fromAddress: user.mainWalletAddress,
    toAddress: user[`${tokenType.toLowerCase()}WalletAddress`],
    note: `Funded ${tokenType} wallet from main wallet`,
    status: "completed",
    createdAt: new Date().toISOString(),
  }

  transactions.push(newTransaction)
  writeJSONFile(TRANSACTIONS_FILE, transactions)

  res.json({ success: true, message: `${tokenType} wallet funded successfully` })
})

// Serve HTML files
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"))
})

app.get("*", (req, res) => {
  // For any other route, try to serve the file from the directory
  const filePath = path.join(__dirname, req.path)

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    res.sendFile(filePath)
  } else {
    // If file doesn't exist, redirect to index
    res.redirect("/")
  }
})

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

