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

  // Load transactions
  loadTransactions()

  // Filter tabs
  const filterTabs = document.querySelectorAll(".filter-tab")
  filterTabs.forEach((tab) => {
    tab.addEventListener("click", function () {
      // Remove active class from all tabs
      filterTabs.forEach((t) => t.classList.remove("active"))

      // Add active class to clicked tab
      this.classList.add("active")

      // Filter transactions
      const filter = this.getAttribute("data-filter")
      filterTransactions(filter)
    })
  })

  // Search functionality
  const transactionSearch = document.getElementById("transactionSearch")
  if (transactionSearch) {
    transactionSearch.addEventListener("input", function () {
      const searchTerm = this.value.toLowerCase()
      const transactionItems = document.querySelectorAll(".transaction-item")

      transactionItems.forEach((item) => {
        const details = item.querySelector(".transaction-details h4").textContent.toLowerCase()
        const date = item.querySelector(".transaction-date").textContent.toLowerCase()
        const amount = item.querySelector(".transaction-amount").textContent.toLowerCase()

        if (details.includes(searchTerm) || date.includes(searchTerm) || amount.includes(searchTerm)) {
          item.style.display = "flex"
        } else {
          item.style.display = "none"
        }
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
  function loadTransactions() {
    const transactionsList = document.getElementById("transactionsList")
    const transactionsLoading = document.getElementById("transactionsLoading")
    const noTransactions = document.getElementById("noTransactions")

    if (!transactionsList || !transactionsLoading || !noTransactions) return

    fetch("/api/transactions", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => response.json())
      .then((data) => {
        // Hide loading spinner
        transactionsLoading.classList.add("hidden")

        if (data.success && data.transactions.length > 0) {
          // Render transactions
          transactionsList.innerHTML = ""
          data.transactions.forEach((transaction) => {
            const transactionItem = createTransactionItem(transaction)
            transactionsList.appendChild(transactionItem)
          })
        } else {
          // Show no transactions message
          noTransactions.classList.remove("hidden")
        }
      })
      .catch((error) => {
        console.error("Error fetching transactions:", error)
        transactionsLoading.classList.add("hidden")
        noTransactions.classList.remove("hidden")

        // Add mock transactions for demo
        const mockTransactions = [
          {
            id: "1",
            type: "received",
            amount: 500,
            from: "Admin",
            to: currentUser.name,
            date: "2025-03-28T10:00:00.000Z",
            status: "completed",
            token: "TRX",
          },
          {
            id: "2",
            type: "sent",
            amount: 100,
            from: currentUser.name,
            to: "Jane Smith",
            date: "2025-03-27T15:30:00.000Z",
            status: "completed",
            token: "USDT",
          },
          {
            id: "3",
            type: "received",
            amount: 250,
            from: "Bob Johnson",
            to: currentUser.name,
            date: "2025-03-26T09:15:00.000Z",
            status: "completed",
            token: "USDC",
          },
        ]

        transactionsList.innerHTML = ""
        mockTransactions.forEach((transaction) => {
          const transactionItem = createTransactionItem(transaction)
          transactionsList.appendChild(transactionItem)
        })
      })
  }

  function createTransactionItem(transaction) {
    const div = document.createElement("div")
    div.className = "transaction-item"
    div.setAttribute("data-type", transaction.type)

    const isReceived = transaction.type === "received"
    const iconClass = isReceived ? "fa-arrow-down received" : "fa-arrow-up sent"
    const amountClass = isReceived ? "amount-received" : "amount-sent"
    const amountPrefix = isReceived ? "+" : "-"

    div.innerHTML = `
      <div class="transaction-info">
        <div class="transaction-icon ${isReceived ? "received" : "sent"}">
          <i class="fas ${iconClass}"></i>
        </div>
        <div class="transaction-details">
          <h4>${isReceived ? `From ${transaction.from}` : `To ${transaction.to}`}</h4>
          <div class="transaction-date">${formatDate(transaction.date)}</div>
        </div>
      </div>
      <div class="transaction-meta">
        <div class="transaction-amount ${amountClass}">${amountPrefix}$${Number.parseFloat(transaction.amount).toFixed(2)}</div>
        <div class="transaction-status">${transaction.status}</div>
      </div>
    `

    // Add click event to show receipt
    div.addEventListener("click", () => {
      showReceipt(transaction)
    })

    return div
  }

  function filterTransactions(filter) {
    const transactionItems = document.querySelectorAll(".transaction-item")

    transactionItems.forEach((item) => {
      if (filter === "all" || item.getAttribute("data-type") === filter) {
        item.style.display = "flex"
      } else {
        item.style.display = "none"
      }
    })
  }

  function formatDate(dateString) {
    const date = new Date(dateString)
    return date.toLocaleDateString() + " " + date.toLocaleTimeString()
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
        <div class="receipt-subtitle">${transaction.type === "received" ? "Received" : "Sent"} ${transaction.token}</div>
      </div>
      
      <div class="receipt-amount">
        <div class="receipt-amount-value">$${Number.parseFloat(transaction.amount).toFixed(2)}</div>
      </div>
      
      <div class="receipt-details">
        <div class="receipt-row">
          <div class="receipt-label">Date</div>
          <div class="receipt-value">${formattedDate}</div>
        </div>
        <div class="receipt-row">
          <div class="receipt-label">From</div>
          <div class="receipt-value">${transaction.from}</div>
        </div>
        <div class="receipt-row">
          <div class="receipt-label">To</div>
          <div class="receipt-value">${transaction.to}</div>
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
          <div class="receipt-value">${transaction.id}</div>
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

