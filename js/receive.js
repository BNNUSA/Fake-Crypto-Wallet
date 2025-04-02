import qrcode from "./qrcode.js"

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
  const tokenType = urlParams.get("token") || "MAIN"

  // Update UI with token name
  const tokenTitle = document.getElementById("tokenTitle")
  const selectedTokenName = document.getElementById("selectedTokenName")
  const tokenSelect = document.getElementById("tokenSelect")

  if (tokenTitle) {
    tokenTitle.textContent = tokenType
  }

  if (selectedTokenName) {
    selectedTokenName.textContent = tokenType
  }

  if (tokenSelect) {
    tokenSelect.value = tokenType
  }

  // Display wallet addresses
  const mainWalletAddress = document.getElementById("mainWalletAddress")
  const trxWalletAddress = document.getElementById("trxWalletAddress")
  const usdtWalletAddress = document.getElementById("usdtWalletAddress")
  const usdcWalletAddress = document.getElementById("usdcWalletAddress")
  const bnbWalletAddress = document.getElementById("bnbWalletAddress")
  const solWalletAddress = document.getElementById("solWalletAddress")
  const ethWalletAddress = document.getElementById("ethWalletAddress")
  const btcWalletAddress = document.getElementById("btcWalletAddress")
  const polWalletAddress = document.getElementById("polWalletAddress")

  if (mainWalletAddress && currentUser.mainWalletAddress) {
    mainWalletAddress.textContent = currentUser.mainWalletAddress
  }

  if (trxWalletAddress && currentUser.trxWalletAddress) {
    trxWalletAddress.textContent = currentUser.trxWalletAddress
  }

  if (usdtWalletAddress && currentUser.usdtWalletAddress) {
    usdtWalletAddress.textContent = currentUser.usdtWalletAddress
  }

  if (usdcWalletAddress && currentUser.usdcWalletAddress) {
    usdcWalletAddress.textContent = currentUser.usdcWalletAddress
  }

  if (bnbWalletAddress && currentUser.bnbWalletAddress) {
    bnbWalletAddress.textContent = currentUser.bnbWalletAddress
  }

  if (solWalletAddress && currentUser.solWalletAddress) {
    solWalletAddress.textContent = currentUser.solWalletAddress
  }

  if (ethWalletAddress && currentUser.ethWalletAddress) {
    ethWalletAddress.textContent = currentUser.ethWalletAddress
  }

  if (btcWalletAddress && currentUser.btcWalletAddress) {
    btcWalletAddress.textContent = currentUser.btcWalletAddress
  }

  if (polWalletAddress && currentUser.polWalletAddress) {
    polWalletAddress.textContent = currentUser.polWalletAddress
  }

  // Get wallet address based on token type
  const displayAddress = document.getElementById("displayAddress")

  // Function to update displayed address based on token type
  function updateDisplayedAddress() {
    let walletAddress

    switch (tokenType.toUpperCase()) {
      case "MAIN":
        walletAddress = currentUser.mainWalletAddress
        break
      case "TRX":
        walletAddress = currentUser.trxWalletAddress
        break
      case "USDT":
        walletAddress = currentUser.usdtWalletAddress
        break
      case "USDC":
        walletAddress = currentUser.usdcWalletAddress
        break
      case "BNB":
        walletAddress = currentUser.bnbWalletAddress
        break
      case "SOL":
        walletAddress = currentUser.solWalletAddress
        break
      case "ETH":
        walletAddress = currentUser.ethWalletAddress
        break
      case "BTC":
        walletAddress = currentUser.btcWalletAddress
        break
      case "POL":
        walletAddress = currentUser.polWalletAddress
        break
      default:
        walletAddress = currentUser.mainWalletAddress
    }

    if (displayAddress) {
      displayAddress.textContent = walletAddress || "Address not available"
    }

    // Generate QR code with the wallet address
    generateQRCode(walletAddress, tokenType)
  }

  // Initial update
  updateDisplayedAddress()

  // Update when token select changes
  if (tokenSelect) {
    tokenSelect.addEventListener("change", function () {
      const selectedToken = this.value

      // Update URL parameter
      const url = new URL(window.location.href)
      url.searchParams.set("token", selectedToken)
      window.history.replaceState({}, "", url)

      // Update token title and selected token name
      if (tokenTitle) tokenTitle.textContent = selectedToken
      if (selectedTokenName) selectedTokenName.textContent = selectedToken

      // Update displayed address
      let walletAddress
      switch (selectedToken) {
        case "MAIN":
          walletAddress = currentUser.mainWalletAddress
          break
        case "TRX":
          walletAddress = currentUser.trxWalletAddress
          break
        case "USDT":
          walletAddress = currentUser.usdtWalletAddress
          break
        case "USDC":
          walletAddress = currentUser.usdcWalletAddress
          break
        case "BNB":
          walletAddress = currentUser.bnbWalletAddress
          break
        case "SOL":
          walletAddress = currentUser.solWalletAddress
          break
        case "ETH":
          walletAddress = currentUser.ethWalletAddress
          break
        case "BTC":
          walletAddress = currentUser.btcWalletAddress
          break
        case "POL":
          walletAddress = currentUser.polWalletAddress
          break
        default:
          walletAddress = currentUser.mainWalletAddress
      }

      if (displayAddress) {
        displayAddress.textContent = walletAddress || "Address not available"
      }

      // Generate QR code with the wallet address
      generateQRCode(walletAddress, selectedToken)
    })
  }

  // Copy address button
  const copyAddressBtn = document.getElementById("copyAddressBtn")
  if (copyAddressBtn) {
    copyAddressBtn.addEventListener("click", () => {
      const addressToCopy = displayAddress.textContent

      if (addressToCopy && addressToCopy !== "Address not available") {
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
  }

  // Copy address buttons in the wallet addresses section
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
        case "bnb":
          addressToCopy = currentUser.bnbWalletAddress
          break
        case "sol":
          addressToCopy = currentUser.solWalletAddress
          break
        case "eth":
          addressToCopy = currentUser.ethWalletAddress
          break
        case "btc":
          addressToCopy = currentUser.btcWalletAddress
          break
        case "pol":
          addressToCopy = currentUser.polWalletAddress
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

  // Share address button
  const shareAddressBtn = document.getElementById("shareAddressBtn")
  if (shareAddressBtn) {
    shareAddressBtn.addEventListener("click", () => {
      const addressToShare = displayAddress.textContent

      if (addressToShare && addressToShare !== "Address not available") {
        if (navigator.share) {
          navigator
            .share({
              title: `My ${tokenType} Wallet Address`,
              text: `Here's my ${tokenType} wallet address: ${addressToShare}`,
            })
            .catch((err) => {
              console.error("Share failed:", err)
            })
        } else {
          alert("Web Share API not supported in your browser. Please copy the address manually.")
        }
      }
    })
  }

  // Helper function to generate QR code
  function generateQRCode(address, token = "MAIN") {
    const qrCode = document.getElementById("qrCode")
    if (!qrCode) return

    // Clear previous QR code
    qrCode.innerHTML = ""

    // Create QR code
    try {
      const qr = qrcode(0, "L")
      qr.addData(`${token.toLowerCase()}:${address}`)
      qr.make()
      qrCode.innerHTML = qr.createImgTag(5)
    } catch (error) {
      console.error("Error generating QR code:", error)
      qrCode.innerHTML = `<div class="qr-error">Error generating QR code</div>`
    }
  }
})

