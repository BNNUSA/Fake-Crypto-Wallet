document.addEventListener("DOMContentLoaded", () => {
  // Check if user is logged in
  const currentUser = JSON.parse(localStorage.getItem("currentUser"))
  const token = localStorage.getItem("token")

  if (!currentUser || !token) {
    // Redirect to login if not logged in
    window.location.href = "index.html"
    return
  }

  // Apply dark mode if enabled
  const isDarkMode = localStorage.getItem("darkMode") === "true"
  if (isDarkMode) {
    document.body.classList.add("dark-mode")
  }

  // Load user data
  const walletName = document.getElementById("walletName")
  const trxWalletAddress = document.getElementById("trxWalletAddress")
  const usdtWalletAddress = document.getElementById("usdtWalletAddress")
  const usdcWalletAddress = document.getElementById("usdcWalletAddress")
  const balanceAmount = document.getElementById("balanceAmount")

  if (walletName) {
    walletName.textContent = "My wallet"
  }

  // Display wallet addresses
  if (trxWalletAddress && currentUser.trxWalletAddress) {
    trxWalletAddress.textContent = formatWalletAddress(currentUser.trxWalletAddress)
  }

  if (usdtWalletAddress && currentUser.usdtWalletAddress) {
    usdtWalletAddress.textContent = formatWalletAddress(currentUser.usdtWalletAddress)
  }

  if (usdcWalletAddress && currentUser.usdcWalletAddress) {
    usdcWalletAddress.textContent = formatWalletAddress(currentUser.usdcWalletAddress)
  }

  // Add main wallet address display
  const mainWalletAddress = document.getElementById("mainWalletAddress")
  if (mainWalletAddress && currentUser.mainWalletAddress) {
    mainWalletAddress.textContent = formatWalletAddress(currentUser.mainWalletAddress)
  }

  // Copy address buttons
  const copyButtons = document.querySelectorAll(".copy-btn")
  copyButtons.forEach((button) => {
    button.addEventListener("click", function () {
      const addressType = this.getAttribute("data-address")
      let addressToCopy

      switch (addressType) {
        case "main":
          addressToCopy = currentUser.mainWalletAddress
          break
        case "trx":
          addressToCopy = currentUser.trxWalletAddress
          break
        case "usdt":
          addressToCopy = currentUser.usdtWalletAddress
          break
        case "usdc":
          addressToCopy = currentUser.usdcWalletAddress
          break
        default:
          addressToCopy = ""
      }

      if (addressToCopy) {
        navigator.clipboard
          .writeText(addressToCopy)
          .then(() => {
            alert("Address copied to clipboard!")
          })
          .catch((err) => {
            console.error("Could not copy text: ", err)
          })
      }
    })
  })

  // Load balance
  loadBalance()

  // Load tokens
  loadTokens()

  // Toggle balance visibility
  const toggleBalanceBtn = document.getElementById("toggleBalanceBtn")
  if (toggleBalanceBtn) {
    toggleBalanceBtn.addEventListener("click", () => {
      if (balanceAmount.textContent === "****") {
        loadBalance()
        toggleBalanceBtn.innerHTML = '<i class="fas fa-eye"></i>'
      } else {
        balanceAmount.textContent = "****"
        toggleBalanceBtn.innerHTML = '<i class="fas fa-eye-slash"></i>'
      }
    })
  }

  // Logout button
  const logoutBtn = document.getElementById("logoutBtn")
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      // Clear user data from localStorage
      localStorage.removeItem("currentUser")
      localStorage.removeItem("token")

      // Redirect to login page
      window.location.href = "index.html"
    })
  }

  // Tab switching
  const tabButtons = document.querySelectorAll(".tab-btn")
  const tabContents = document.querySelectorAll(".tab-content")

  tabButtons.forEach((button) => {
    button.addEventListener("click", function () {
      // Remove active class from all buttons and contents
      tabButtons.forEach((btn) => btn.classList.remove("active"))
      tabContents.forEach((content) => content.classList.remove("active"))

      // Add active class to clicked button
      this.classList.add("active")

      // Show corresponding tab content
      const tabId = this.getAttribute("data-tab") + "-tab"
      document.getElementById(tabId).classList.add("active")
    })
  })

  // Coming soon features
  const earnBtn = document.getElementById("earnBtn")
  const swapBtn = document.getElementById("swapBtn")
  const settingsBtn = document.getElementById("settingsBtn")
  const trendingBtn = document.getElementById("trendingBtn")
  const getGasBtn = document.getElementById("getGasBtn")
  const marketsBtn = document.getElementById("marketsBtn")
  const tradeBtn = document.getElementById("tradeBtn")
  const discoverBtn = document.getElementById("discoverBtn")
  const comingSoonModal = document.getElementById("comingSoonModal")

  const comingSoonFeatures = [earnBtn, settingsBtn, trendingBtn, swapBtn, getGasBtn, marketsBtn, tradeBtn, discoverBtn]

  comingSoonFeatures.forEach((btn) => {
    if (btn) {
      btn.addEventListener("click", (e) => {
        e.preventDefault()
        comingSoonModal.classList.add("active")
      })
    }
  })

  // Close modals
  const closeModalButtons = document.querySelectorAll(".close-modal")
  closeModalButtons.forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".modal").forEach((modal) => {
        modal.classList.remove("active")
      })
    })
  })

  // Backup button
  const backupBtn = document.getElementById("backupBtn")
  if (backupBtn) {
    backupBtn.addEventListener("click", () => {
      comingSoonModal.classList.add("active")
    })
  }

  // Manage tokens button
  const manageTokensBtn = document.getElementById("manageTokensBtn")
  if (manageTokensBtn) {
    manageTokensBtn.addEventListener("click", () => {
      comingSoonModal.classList.add("active")
    })
  }

  // Helper functions
  function loadBalance() {
    if (!balanceAmount) return

    fetch("/api/users/balance", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          balanceAmount.textContent = `$${formatNumber(data.balance)}`
        } else {
          balanceAmount.textContent = "$0.00"
        }
      })
      .catch((error) => {
        console.error("Error loading balance:", error)
        balanceAmount.textContent = "$0.00"
      })
  }

  function loadTokens() {
    const tokenList = document.getElementById("tokenList")
    if (!tokenList) return

    fetch("/api/users/tokens", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success && data.tokens.length > 0) {
          tokenList.innerHTML = ""
          data.tokens.forEach((token) => {
            const tokenItem = createTokenItem(token)
            tokenList.appendChild(tokenItem)
          })
        } else {
          // Add default tokens
          const defaultTokens = [
            { symbol: "TRX", name: "TRON", balance: 0, price: 0.2517, change: 0.06 },
            { symbol: "USDT", name: "Tether", balance: 0, price: 1.0, change: 0.0 },
            { symbol: "USDC", name: "USD Coin", balance: 0, price: 1.01, change: 42.81 },
          ]

          tokenList.innerHTML = ""
          defaultTokens.forEach((token) => {
            const tokenItem = createTokenItem(token)
            tokenList.appendChild(tokenItem)
          })
        }
      })
      .catch((error) => {
        console.error("Error loading tokens:", error)

        // Add default tokens on error
        const defaultTokens = [
          { symbol: "TRX", name: "TRON", balance: 0, price: 0.2517, change: 0.06 },
          { symbol: "USDT", name: "Tether", balance: 0, price: 1.0, change: 0.0 },
          { symbol: "USDC", name: "USD Coin", balance: 0, price: 1.01, change: 42.81 },
        ]

        tokenList.innerHTML = ""
        defaultTokens.forEach((token) => {
          const tokenItem = createTokenItem(token)
          tokenList.appendChild(tokenItem)
        })
      })
  }

  function createTokenItem(token) {
    const div = document.createElement("div")
    div.className = "token-item"
    div.setAttribute("data-token", token.symbol)

    const changeClass = token.change >= 0 ? "positive" : "negative"
    const changePrefix = token.change >= 0 ? "+" : ""

    div.innerHTML = `
   <div class="token-icon ${token.symbol.toLowerCase()}">
     <img src="img/${token.symbol.toLowerCase()}.png" alt="${token.name}" onerror="this.src='img/default-token.png'">
   </div>
   <div class="token-info">
     <div class="token-name">${token.symbol}</div>
     <div class="token-subtitle">${token.name}</div>
     <div class="token-balance">${formatNumber(token.balance)}</div>
   </div>
   <div class="token-price">
     <div class="token-value">$${formatNumber(token.balance * token.price)}</div>
     <div class="token-change ${changeClass}">$${token.price.toFixed(2)} ${changePrefix}${token.change}%</div>
   </div>
 `

    // Add click event to show token actions
    div.addEventListener("click", () => {
      showTokenActions(token.symbol)
    })

    return div
  }

  // Add this function to show token actions
  function showTokenActions(tokenSymbol) {
    // Create modal for token actions
    const modal = document.createElement("div")
    modal.className = "modal active"
    modal.id = "tokenActionsModal"

    modal.innerHTML = `
 <div class="modal-content">
   <div class="modal-header">
     <h3>${tokenSymbol} Actions</h3>
     <button class="close-modal">&times;</button>
   </div>
   <div class="modal-body">
     <div class="token-actions-container">
       <a href="send.html?token=${tokenSymbol}" class="token-action-btn">
         <i class="fas fa-arrow-up"></i>
         <span>Send ${tokenSymbol}</span>
       </a>
       <a href="receive.html?token=${tokenSymbol}" class="token-action-btn">
         <i class="fas fa-arrow-down"></i>
         <span>Receive ${tokenSymbol}</span>
       </a>
       <a href="#" class="token-action-btn fund-token-btn" data-token="${tokenSymbol}">
         <i class="fas fa-wallet"></i>
         <span>Fund from Main</span>
       </a>
     </div>
   </div>
 </div>
`

    document.body.appendChild(modal)

    // Add event listener to close modal
    const closeBtn = modal.querySelector(".close-modal")
    closeBtn.addEventListener("click", () => {
      document.body.removeChild(modal)
    })

    // Add event listener for fund token button
    const fundTokenBtn = modal.querySelector(".fund-token-btn")
    if (fundTokenBtn) {
      fundTokenBtn.addEventListener("click", (e) => {
        e.preventDefault()
        showFundTokenModal(tokenSymbol)
      })
    }

    // Close modal when clicking outside
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal)
      }
    })
  }

  // Add function to show fund token modal
  function showFundTokenModal(tokenSymbol) {
    // Remove existing token actions modal
    const existingModal = document.getElementById("tokenActionsModal")
    if (existingModal) {
      document.body.removeChild(existingModal)
    }

    // Create fund token modal
    const modal = document.createElement("div")
    modal.className = "modal active"
    modal.id = "fundTokenModal"

    modal.innerHTML = `
 <div class="modal-content">
   <div class="modal-header">
     <h3>Fund ${tokenSymbol} Wallet</h3>
     <button class="close-modal">&times;</button>
   </div>
   <div class="modal-body">
     <form id="fundTokenForm">
       <input type="hidden" id="tokenType" value="${tokenSymbol}">
       <div class="form-group">
         <label for="fundAmount">Amount</label>
         <div class="input-with-icon">
           <i class="fas fa-dollar-sign"></i>
           <input type="number" id="fundAmount" min="0.01" step="0.01" placeholder="0.00" required>
         </div>
       </div>
       
       <div class="form-error" id="fundTokenError"></div>
       
       <button type="submit" class="btn btn-primary btn-block">
         <i class="fas fa-wallet"></i> Fund ${tokenSymbol} Wallet
       </button>
     </form>
   </div>
 </div>
`

    document.body.appendChild(modal)

    // Add event listener to close modal
    const closeBtn = modal.querySelector(".close-modal")
    closeBtn.addEventListener("click", () => {
      document.body.removeChild(modal)
    })

    // Add event listener for fund token form
    const fundTokenForm = document.getElementById("fundTokenForm")
    if (fundTokenForm) {
      fundTokenForm.addEventListener("submit", (e) => {
        e.preventDefault()
        const tokenType = document.getElementById("tokenType").value
        const amount = document.getElementById("fundAmount").value
        const errorElement = document.getElementById("fundTokenError")

        // Clear previous errors
        errorElement.textContent = ""

        // Validate amount
        if (Number.parseFloat(amount) <= 0) {
          errorElement.textContent = "Amount must be greater than 0"
          return
        }

        // Make API request to fund token wallet
        fetch("/api/transactions/fund-token", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            tokenType,
            amount: Number.parseFloat(amount),
          }),
        })
          .then((response) => response.json())
          .then((data) => {
            if (data.success) {
              // Close modal
              document.body.removeChild(modal)

              // Show success message
              alert(`Successfully funded ${tokenType} wallet with $${amount}`)

              // Reload page to update balances
              window.location.reload()
            } else {
              errorElement.textContent = data.message || "Failed to fund wallet"
            }
          })
          .catch((error) => {
            errorElement.textContent = "An error occurred. Please try again."
            console.error("Fund token error:", error)
          })
      })
    }

    // Close modal when clicking outside
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal)
      }
    })
  }

  function formatWalletAddress(address) {
    if (!address) return "Not available"
    if (address.length <= 12) return address
    return address.substring(0, 10) + "..." + address.substring(address.length - 6)
  }

  // Format number with commas
  function formatNumber(num) {
    if (num === undefined || num === null) return "0.00"
    return Number.parseFloat(num).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }
})

// Add refresh tokens functionality
document.addEventListener("DOMContentLoaded", () => {
  // Refresh tokens button
  const refreshTokensBtn = document.getElementById("refreshTokensBtn")
  if (refreshTokensBtn) {
    refreshTokensBtn.addEventListener("click", () => {
      loadTokens()
    })
  }
})

