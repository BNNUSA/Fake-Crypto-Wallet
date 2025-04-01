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
  const tokenType = urlParams.get("token") || "TRX"

  // Update UI with token name
  const tokenTitle = document.getElementById("tokenTitle")
  const selectedTokenName = document.getElementById("selectedTokenName")

  if (tokenTitle) {
    tokenTitle.textContent = tokenType
  }

  if (selectedTokenName) {
    selectedTokenName.textContent = tokenType
  }

  // Get wallet address based on token type
  const displayAddress = document.getElementById("displayAddress")

  // Function to update displayed address based on token type
  function updateDisplayedAddress() {
    let walletAddress

    switch (tokenType) {
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
      default:
        walletAddress = currentUser.trxWalletAddress
    }

    if (displayAddress) {
      displayAddress.textContent = walletAddress || "Address not available"
    }

    // Generate QR code with the wallet address
    generateQRCode(walletAddress, tokenType)
  }

  // Initial update
  updateDisplayedAddress()

  // Copy address button
  const copyAddressBtn = document.getElementById("copyAddressBtn")
  if (copyAddressBtn) {
    copyAddressBtn.addEventListener("click", () => {
      let walletAddress

      switch (tokenType) {
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
        default:
          walletAddress = currentUser.trxWalletAddress
      }

      navigator.clipboard
        .writeText(walletAddress)
        .then(() => {
          alert("Address copied to clipboard!")
        })
        .catch((err) => {
          console.error("Could not copy text: ", err)
        })
    })
  }

  // Share address button
  const shareAddressBtn = document.getElementById("shareAddressBtn")
  if (shareAddressBtn) {
    shareAddressBtn.addEventListener("click", () => {
      let walletAddress

      switch (tokenType) {
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
        default:
          walletAddress = currentUser.trxWalletAddress
      }

      if (navigator.share) {
        navigator
          .share({
            title: `My ${tokenType} Wallet Address`,
            text: `Here's my ${tokenType} wallet address: ${walletAddress}`,
          })
          .catch((err) => {
            console.error("Share failed:", err)
          })
      } else {
        alert("Web Share API not supported in your browser. Please copy the address manually.")
      }
    })
  }

  // Helper function to generate QR code
  function generateQRCode(address, token = "TRX") {
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

