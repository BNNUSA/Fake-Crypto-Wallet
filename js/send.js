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

  // Get token from URL parameters
  const urlParams = new URLSearchParams(window.location.search)
  const tokenType = urlParams.get("token") || "TRX"

  // Update UI with token name
  const tokenTitle = document.getElementById("tokenTitle")
  const tokenTypeSelect = document.getElementById("tokenType")

  if (tokenTitle) {
    tokenTitle.textContent = "Funds"
  }

  if (tokenTypeSelect && tokenType) {
    tokenTypeSelect.value = tokenType
  }

  // Handle send options
  const sendOptions = document.querySelectorAll(".send-option")
  const sendForms = document.querySelectorAll(".send-form")

  sendOptions.forEach((option) => {
    option.addEventListener("click", function () {
      // Remove active class from all options and forms
      sendOptions.forEach((opt) => opt.classList.remove("active"))
      sendForms.forEach((form) => form.classList.remove("active"))

      // Add active class to clicked option
      this.classList.add("active")

      // Show corresponding form
      const formId = this.getAttribute("data-form")
      document.getElementById(formId).classList.add("active")
    })
  })

  // Set the first option as active by default
  if (sendOptions.length > 0 && !document.querySelector(".send-option.active")) {
    sendOptions[0].classList.add("active")
    const defaultFormId = sendOptions[0].getAttribute("data-form")
    document.getElementById(defaultFormId).classList.add("active")
  }

  // Main Wallet Form
  const mainWalletForm = document.getElementById("mainWalletForm")
  if (mainWalletForm) {
    mainWalletForm.addEventListener("submit", (e) => {
      e.preventDefault()
      const recipientAddress = document.getElementById("mainRecipientAddress").value
      const amount = document.getElementById("mainAmount").value
      const note = document.getElementById("mainNote").value
      const errorElement = document.getElementById("mainSendError")

      // Clear previous errors
      errorElement.textContent = ""

      // Validate amount
      if (Number.parseFloat(amount) <= 0) {
        errorElement.textContent = "Amount must be greater than 0"
        return
      }

      // Make API request to send funds from main wallet
      fetch("/api/transactions/send-main", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          recipientAddress,
          amount: Number.parseFloat(amount),
          note,
        }),
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`)
          }
          return response.json()
        })
        .then((data) => {
          if (data.success) {
            // Show receipt
            showReceipt({
              type: "sent",
              amount: Number.parseFloat(amount),
              token: "MAIN",
              recipient: recipientAddress,
              date: new Date().toISOString(),
              txId: data.transactionId || generateTxId(),
              note,
            })

            // Update the current user's balance in localStorage
            const updatedUser = { ...currentUser }
            updatedUser.balance -= Number.parseFloat(amount)
            localStorage.setItem("currentUser", JSON.stringify(updatedUser))

            // Show success message
            alert("Transfer successful!")
          } else {
            errorElement.textContent = data.message || "Failed to send funds"
          }
        })
        .catch((error) => {
          console.error("Send funds error:", error)
          errorElement.textContent = "An error occurred. Please try again."
        })
    })
  }

  // Token Form
  const tokenForm = document.getElementById("tokenForm")
  if (tokenForm) {
    tokenForm.addEventListener("submit", (e) => {
      e.preventDefault()
      const tokenType = document.getElementById("tokenType").value
      const recipientAddress = document.getElementById("recipientAddress").value
      const amount = document.getElementById("tokenAmount").value
      const note = document.getElementById("tokenNote").value
      const errorElement = document.getElementById("sendTokenError")

      // Clear previous errors
      errorElement.textContent = ""

      // Validate amount
      if (Number.parseFloat(amount) <= 0) {
        errorElement.textContent = "Amount must be greater than 0"
        return
      }

      // Check if user has enough balance
      let userBalance = 0
      switch (tokenType) {
        case "TRX":
          userBalance = currentUser.trxBalance || 0
          break
        case "USDT":
          userBalance = currentUser.usdtBalance || 0
          break
        case "USDC":
          userBalance = currentUser.usdcBalance || 0
          break
      }

      if (Number.parseFloat(amount) > userBalance) {
        errorElement.textContent = `Insufficient ${tokenType} balance. You have ${userBalance} ${tokenType}.`
        return
      }

      // Make API request to send token
      fetch("/api/transactions/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          recipientAddress,
          amount: Number.parseFloat(amount),
          tokenType,
          note,
        }),
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`)
          }
          return response.json()
        })
        .then((data) => {
          if (data.success) {
            // Show receipt
            showReceipt({
              type: "sent",
              amount: Number.parseFloat(amount),
              token: tokenType,
              recipient: recipientAddress,
              date: new Date().toISOString(),
              txId: data.transactionId || generateTxId(),
              note,
            })

            // Update the current user's token balance in localStorage
            const updatedUser = { ...currentUser }
            switch (tokenType) {
              case "TRX":
                updatedUser.trxBalance -= Number.parseFloat(amount)
                break
              case "USDT":
                updatedUser.usdtBalance -= Number.parseFloat(amount)
                break
              case "USDC":
                updatedUser.usdcBalance -= Number.parseFloat(amount)
                break
            }
            localStorage.setItem("currentUser", JSON.stringify(updatedUser))

            // Show success message
            alert("Transfer successful!")
          } else {
            errorElement.textContent = data.message || "Failed to send funds"
          }
        })
        .catch((error) => {
          console.error("Send token error:", error)
          errorElement.textContent = "An error occurred. Please try again."
        })
    })
  }

  // Close modals
  const closeModalButtons = document.querySelectorAll(".close-modal")
  closeModalButtons.forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".modal").forEach((modal) => {
        modal.classList.remove("active")
      })
    })
  })

  // Helper functions
  function generateTxId() {
    return "tx_" + Math.random().toString(36).substring(2, 15)
  }

  function showReceipt(transaction) {
    const receiptModal = document.getElementById("receiptModal")
    const receiptContent = document.getElementById("receiptContent")

    if (!receiptModal || !receiptContent) return

    const date = new Date(transaction.date)
    const formattedDate = date.toLocaleDateString() + " " + date.toLocaleTimeString()

    receiptContent.innerHTML = `
      <div class="receipt-header">
        <div class="receipt-logo"><i class="fas fa-receipt"></i></div>
        <div class="receipt-title">Transaction Receipt</div>
        <div class="receipt-subtitle">Sent ${transaction.token}</div>
      </div>
      
      <div class="receipt-amount">
        <div class="receipt-amount-value">${transaction.amount.toFixed(2)} ${transaction.token}</div>
      </div>
      
      <div class="receipt-details">
        <div class="receipt-row">
          <div class="receipt-label">Date</div>
          <div class="receipt-value">${formattedDate}</div>
        </div>
        <div class="receipt-row">
          <div class="receipt-label">From</div>
          <div class="receipt-value">${currentUser.name}</div>
        </div>
        <div class="receipt-row">
          <div class="receipt-label">To</div>
          <div class="receipt-value">${transaction.recipient}</div>
        </div>
        <div class="receipt-row">
          <div class="receipt-label">Token</div>
          <div class="receipt-value">${transaction.token}</div>
        </div>
        ${
          transaction.note
            ? `
        <div class="receipt-row">
          <div class="receipt-label">Note</div>
          <div class="receipt-value">${transaction.note}</div>
        </div>
        `
            : ""
        }
        <div class="receipt-row">
          <div class="receipt-label">Transaction ID</div>
          <div class="receipt-value">${transaction.txId}</div>
        </div>
        <div class="receipt-row">
          <div class="receipt-label">Status</div>
          <div class="receipt-value">Completed</div>
        </div>
      </div>
      
      <div class="receipt-footer">
        <p>Thank you for using our service</p>
      </div>
    `

    receiptModal.classList.add("active")

    // Print receipt functionality
    const printReceiptBtn = document.getElementById("printReceiptBtn")
    if (printReceiptBtn) {
      printReceiptBtn.addEventListener("click", () => {
        const printWindow = window.open("", "", "width=600,height=600")
        printWindow.document.write("<html><head><title>Transaction Receipt</title>")
        printWindow.document.write(
          "<style>body { font-family: Arial, sans-serif; padding: 20px; } .receipt { padding: 20px; border: 1px solid #ddd; } .receipt-header { text-align: center; margin-bottom: 20px; } .receipt-title { font-size: 18px; font-weight: bold; } .receipt-amount { text-align: center; margin: 20px 0; font-size: 24px; font-weight: bold; } .receipt-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; } .receipt-footer { text-align: center; margin-top: 20px; color: #666; }</style>",
        )
        printWindow.document.write("</head><body>")
        printWindow.document.write(receiptContent.innerHTML)
        printWindow.document.write("</body></html>")
        printWindow.document.close()
        printWindow.focus()
        setTimeout(() => {
          printWindow.print()
          printWindow.close()
        }, 250)
      })
    }
  }
})

