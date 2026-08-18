/* ==========================================================================
   Zarnab WATCHES - APPLICATION CORE LOGIC & GEMINI CHATBOT INTEGRATION
   ========================================================================== */

// Gemini API Configuration
// Put your Gemini API Key here or enter it when prompted in the chatbot UI
const GEMINI_API_KEY = window.GEMINI_API_KEY || "YOUR_GEMINI_API_KEY";
const GEMINI_SYSTEM_INSTRUCTION = `You are "Zara," the friendly virtual assistant for Zarnab Watches, a boutique watch store known for timeless, elegant designs. Your job is to help customers browse the collection, answer questions about watch materials, sizing, water resistance, warranty, and care instructions, and guide them toward making a purchase or contacting the store for custom orders. Keep your tone warm, polished, and concise — like a helpful boutique staff member, not a generic bot. If you don't know specific stock or pricing details, politely direct the customer to contact the store directly via WhatsApp or email. Never make up product details you weren't given.`;

// Products Data Matrix
const WATCH_PRODUCTS = [
    {
        id: 1,
        name: "The Imperial Gold",
        category: "gold",
        price: 320,
        badge: "Bestseller",
        image: "images/watch1.png",
        specs: "39mm Gold Mesh | Swiss Quartz | Sapphire Crystal",
        description: "A signature timepiece featuring a polished brushed gold mesh bracelet, champagne sunburst dial, and precision Swiss movement."
    },
    {
        id: 2,
        name: "Nocturne Onyx Edition",
        category: "leather",
        price: 380,
        badge: "New Arrival",
        image: "images/hero.png",
        specs: "41mm Matte Black | Italian Leather | Automatic",
        description: "Stealth elegance personified. Matte black stainless steel casing paired with genuine black Italian leather and rose gold hand accents."
    },
    {
        id: 3,
        name: "Ivory Heritage Automatic",
        category: "automatic",
        price: 450,
        badge: "Heritage Series",
        image: "images/watch1.png",
        specs: "40mm Rose Gold | Ivory Sunburst | 42h Power Reserve",
        description: "Classic horological perfection. An open-heart automatic movement encased in polished rose gold with an ivory face and alligator leather strap."
    },
    {
        id: 4,
        name: "Aura Emerald Sunburst",
        category: "gold",
        price: 290,
        badge: "Limited Edition",
        image: "images/hero.png",
        specs: "38mm Emerald Face | Gold Link Strap | 50m Water Resistant",
        description: "Captivating rich emerald green sunray dial housed in ultra-slim gold stainless steel. Elegant, vibrant, and unforgettable."
    },
    {
        id: 5,
        name: "Celeste Pearl Horizon",
        category: "automatic",
        price: 410,
        badge: "Pure Elegance",
        image: "images/watch1.png",
        specs: "36mm Mother of Pearl | Diamond Indices | Swiss Movement",
        description: "Delicate luxury for smaller wrists. Genuine iridescent mother of pearl dial framed with subtle cubic zirconia markers and slim gold bezel."
    },
    {
        id: 6,
        name: "Royal Chrono Sapphire",
        category: "automatic",
        price: 520,
        badge: "Flagship",
        image: "images/hero.png",
        specs: "42mm Chronograph | Dual Timezone | 100m Water Resistance",
        description: "Our flagship dual-subdial chronograph. Engineered for high performance with scratch-proof sapphire crystal and brushed gold finish."
    }
];

// Shopping Cart State
let cart = [];

// Gemini Chat Conversation State
let chatHistory = [
    {
        role: "model",
        parts: [{ text: "Welcome to Zarnab Watches. I'm Zara, your personal boutique assistant. How may I assist you with our collection, materials, or warranty today?" }]
    }
];

// DOM Content Loaded Handler
document.addEventListener("DOMContentLoaded", () => {
    initProductsGrid();
    initFilters();
    initCartDrawer();
    initQuickViewModal();
    initContactForm();
    initNewsletterForm();
    initMobileMenu();
    initGeminiChatbot();
});

/* --------------------------------------------------------------------------
   1. PRODUCTS GRID RENDER
   -------------------------------------------------------------------------- */
function initProductsGrid(filterCategory = "all") {
    const container = document.getElementById("products-grid");
    if (!container) return;

    const filtered = filterCategory === "all" 
        ? WATCH_PRODUCTS 
        : WATCH_PRODUCTS.filter(p => p.category === filterCategory);

    container.innerHTML = filtered.map(product => `
        <div class="product-card" data-category="${product.category}">
            <span class="product-badge">${product.badge}</span>
            <div class="product-img-wrapper">
                <img src="${product.image}" alt="${product.name}" class="product-img">
                <button class="quick-view-btn" onclick="openQuickView(${product.id})">
                    <i class="fa-solid fa-eye"></i> Quick View
                </button>
            </div>
            <div class="product-info">
                <span class="product-category">Zarnab Collection</span>
                <h3 class="product-name">${product.name}</h3>
                <p class="product-specs">${product.specs}</p>
                <div class="product-bottom">
                    <span class="product-price">$${product.price}</span>
                    <button class="add-cart-btn" onclick="addToCart(${product.id})">
                        <i class="fa-solid fa-bag-shopping"></i> Add to Cart
                    </button>
                </div>
            </div>
        </div>
    `).join("");
}

function initFilters() {
    const filterBtns = document.querySelectorAll(".filter-btn");
    filterBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            filterBtns.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            const category = btn.getAttribute("data-filter");
            initProductsGrid(category);
        });
    });
}

/* --------------------------------------------------------------------------
   2. SHOPPING CART DRAWER
   -------------------------------------------------------------------------- */
function initCartDrawer() {
    const cartToggleBtn = document.getElementById("cart-toggle-btn");
    const closeCartBtn = document.getElementById("close-cart-btn");
    const cartDrawer = document.getElementById("cart-drawer");
    const cartOverlay = document.getElementById("cart-overlay");
    const checkoutBtn = document.getElementById("checkout-btn");

    if (cartToggleBtn) cartToggleBtn.addEventListener("click", openCart);
    if (closeCartBtn) closeCartBtn.addEventListener("click", closeCart);
    if (cartOverlay) cartOverlay.addEventListener("click", closeCart);

    if (checkoutBtn) {
        checkoutBtn.addEventListener("click", () => {
            if (cart.length === 0) {
                alert("Your luxury cart is empty. Please add a timepiece to proceed.");
                return;
            }
            alert("Thank you for choosing Zarnab Watches! Redirecting to secure concierge checkout window...");
            cart = [];
            updateCartUI();
            closeCart();
        });
    }
}

function openCart() {
    document.getElementById("cart-drawer")?.classList.add("active");
    document.getElementById("cart-overlay")?.classList.add("active");
}

function closeCart() {
    document.getElementById("cart-drawer")?.classList.remove("active");
    document.getElementById("cart-overlay")?.classList.remove("active");
}

function addToCart(productId) {
    const product = WATCH_PRODUCTS.find(p => p.id === productId);
    if (!product) return;

    const existingIndex = cart.findIndex(item => item.id === productId);
    if (existingIndex > -1) {
        cart[existingIndex].qty += 1;
    } else {
        cart.push({ ...product, qty: 1 });
    }

    updateCartUI();
    openCart();
}

function updateCartQty(productId, change) {
    const itemIndex = cart.findIndex(item => item.id === productId);
    if (itemIndex > -1) {
        cart[itemIndex].qty += change;
        if (cart[itemIndex].qty <= 0) {
            cart.splice(itemIndex, 1);
        }
    }
    updateCartUI();
}

function updateCartUI() {
    const badge = document.getElementById("cart-badge-count");
    const container = document.getElementById("cart-items-container");
    const subtotalEl = document.getElementById("cart-subtotal-price");

    const totalCount = cart.reduce((sum, item) => sum + item.qty, 0);
    const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

    if (badge) badge.innerText = totalCount;
    if (subtotalEl) subtotalEl.innerText = `$${totalPrice.toFixed(2)}`;

    if (!container) return;

    if (cart.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px 10px; color: var(--color-text-dim);">
                <i class="fa-solid fa-bag-shopping" style="font-size: 3rem; color: var(--color-gold-primary); opacity: 0.4; margin-bottom: 16px;"></i>
                <p style="font-family: var(--font-heading); font-size: 1.1rem; color: var(--color-ivory);">Your Selection is Empty</p>
                <p style="font-size: 0.85rem; margin-top: 8px;">Explore our collection and add your desired timepiece.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = cart.map(item => `
        <div class="cart-item">
            <img src="${item.image}" alt="${item.name}" class="cart-item-img">
            <div class="cart-item-info">
                <h4 class="cart-item-title">${item.name}</h4>
                <div class="cart-item-price">$${item.price}</div>
                <div class="cart-qty-controls">
                    <button class="qty-btn" onclick="updateCartQty(${item.id}, -1)">-</button>
                    <span style="font-size: 0.85rem; font-weight: 600;">${item.qty}</span>
                    <button class="qty-btn" onclick="updateCartQty(${item.id}, 1)">+</button>
                </div>
            </div>
        </div>
    `).join("");
}

/* --------------------------------------------------------------------------
   3. QUICK VIEW MODAL
   -------------------------------------------------------------------------- */
function initQuickViewModal() {
    const overlay = document.getElementById("modal-overlay");
    const closeBtn = document.getElementById("close-modal-btn");
    
    if (overlay) overlay.addEventListener("click", closeQuickView);
    if (closeBtn) closeBtn.addEventListener("click", closeQuickView);
}

function openQuickView(productId) {
    const product = WATCH_PRODUCTS.find(p => p.id === productId);
    if (!product) return;

    const modalBody = document.getElementById("modal-body-content");
    if (modalBody) {
        modalBody.innerHTML = `
            <div class="modal-grid">
                <div style="text-align: center;">
                    <img src="${product.image}" alt="${product.name}" style="max-height: 280px; margin: 0 auto; filter: drop-shadow(0 10px 20px rgba(0,0,0,0.8));">
                </div>
                <div>
                    <span class="product-badge" style="position: static; display: inline-block; margin-bottom: 12px;">${product.badge}</span>
                    <h2 style="font-family: var(--font-heading); font-size: 1.8rem; color: var(--color-ivory); margin-bottom: 8px;">${product.name}</h2>
                    <div style="font-size: 1.5rem; font-family: var(--font-heading); color: var(--color-gold-primary); font-weight: 800; margin-bottom: 16px;">$${product.price} USD</div>
                    <p style="color: var(--color-text-body); font-size: 0.9rem; margin-bottom: 20px; line-height: 1.6;">${product.description}</p>
                    <div style="background: rgba(0,0,0,0.4); padding: 12px 16px; border-radius: 8px; border: 1px solid var(--border-gold-subtle); margin-bottom: 24px;">
                        <span style="font-size: 0.8rem; color: var(--color-gold-primary); font-weight: 700; display: block; margin-bottom: 4px;">TECHNICAL SPECIFICATIONS:</span>
                        <span style="font-size: 0.85rem; color: var(--color-ivory);">${product.specs}</span>
                    </div>
                    <button class="btn btn-primary btn-full" onclick="addToCart(${product.id}); closeQuickView();">
                        <span>Add To Cart</span>
                        <i class="fa-solid fa-bag-shopping"></i>
                    </button>
                </div>
            </div>
        `;
    }

    document.getElementById("product-modal")?.classList.add("active");
    document.getElementById("modal-overlay")?.classList.add("active");
}

function closeQuickView() {
    document.getElementById("product-modal")?.classList.remove("active");
    document.getElementById("modal-overlay")?.classList.remove("active");
}

/* --------------------------------------------------------------------------
   4. CONTACT & NEWSLETTER FORMS
   -------------------------------------------------------------------------- */
function initContactForm() {
    const form = document.getElementById("boutique-contact-form");
    const feedback = document.getElementById("form-feedback");

    if (form) {
        form.addEventListener("submit", (e) => {
            e.preventDefault();
            const name = document.getElementById("contact-name").value;
            
            if (feedback) {
                feedback.classList.remove("hidden");
                feedback.className = "form-feedback success";
                feedback.innerHTML = `✨ Thank you, ${name}! Your inquiry has been sent directly to our Zarnab Concierge team. We will reply within 2 hours.`;
                form.reset();
                setTimeout(() => feedback.classList.add("hidden"), 6000);
            }
        });
    }
}

function initNewsletterForm() {
    const form = document.getElementById("newsletter-form");
    if (form) {
        form.addEventListener("submit", (e) => {
            e.preventDefault();
            alert("✨ Welcome to the Zarnab Privilege Club! Check your inbox for your 10% private welcome voucher.");
            form.reset();
        });
    }
}

/* --------------------------------------------------------------------------
   5. MOBILE NAVIGATION MENU
   -------------------------------------------------------------------------- */
function initMobileMenu() {
    const toggleBtn = document.getElementById("mobile-menu-toggle");
    const menu = document.getElementById("nav-menu");
    const links = document.querySelectorAll(".nav-link");

    if (toggleBtn && menu) {
        toggleBtn.addEventListener("click", () => {
            menu.classList.toggle("active");
        });

        links.forEach(link => {
            link.addEventListener("click", () => {
                menu.classList.remove("active");
            });
        });
    }
}

/* --------------------------------------------------------------------------
   6. FLOATING GEMINI CHATBOT INTEGRATION ("ZARA" ASSISTANT)
   -------------------------------------------------------------------------- */
function initGeminiChatbot() {
    const triggerBtn = document.getElementById("chatbot-trigger");
    const windowEl = document.getElementById("chatbot-window");
    const minimizeBtn = document.getElementById("chat-minimize-btn");
    const openIcon = document.querySelector(".chat-open-icon");
    const closeIcon = document.querySelector(".chat-close-icon");
    const chatInput = document.getElementById("chat-input");
    const sendBtn = document.getElementById("send-chat-btn");
    const promptChips = document.querySelectorAll(".prompt-chip");

    // Toggle Chat Visibility
    function toggleChat() {
        const isHidden = windowEl.classList.contains("hidden");
        if (isHidden) {
            windowEl.classList.remove("hidden");
            openIcon?.classList.add("hidden");
            closeIcon?.classList.remove("hidden");
            chatInput?.focus();
        } else {
            windowEl.classList.add("hidden");
            openIcon?.classList.remove("hidden");
            closeIcon?.classList.add("hidden");
        }
    }

    if (triggerBtn) triggerBtn.addEventListener("click", toggleChat);
    if (minimizeBtn) minimizeBtn.addEventListener("click", toggleChat);

    // Prompt Chips Listener
    promptChips.forEach(chip => {
        chip.addEventListener("click", () => {
            const promptText = chip.getAttribute("data-prompt");
            if (promptText) {
                handleUserMessage(promptText);
            }
        });
    });

    // Send Message Handler
    function sendMessage() {
        const text = chatInput.value.trim();
        if (text === "") return;
        chatInput.value = "";
        handleUserMessage(text);
    }

    if (sendBtn) sendBtn.addEventListener("click", sendMessage);
    if (chatInput) {
        chatInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                sendMessage();
            }
        });
    }
}

// User Message Dispatcher
async function handleUserMessage(userText) {
    const messagesContainer = document.getElementById("chat-messages");
    const typingIndicator = document.getElementById("typing-indicator");

    // 1. Append User Message UI
    appendChatMessage("user", userText);

    // 2. Add to Gemini Chat History State
    chatHistory.push({
        role: "user",
        parts: [{ text: userText }]
    });

    // 3. Show Typing Indicator
    if (typingIndicator) typingIndicator.classList.remove("hidden");
    scrollChatToBottom();

    // 4. Request Response from Gemini API (with Domain Fallback)
    try {
        const responseText = await callGeminiAPI(userText);
        
        // Hide Typing Indicator
        if (typingIndicator) typingIndicator.classList.add("hidden");

        // Append Model Message UI
        appendChatMessage("assistant", responseText);

        // Record in Chat History
        chatHistory.push({
            role: "model",
            parts: [{ text: responseText }]
        });
    } catch (error) {
        console.warn("Gemini API direct call notice:", error);
        if (typingIndicator) typingIndicator.classList.add("hidden");
        
        // Use Intelligent Boutique Fallback Response
        const fallbackText = getBoutiqueFallbackResponse(userText);
        appendChatMessage("assistant", fallbackText);
    }

    scrollChatToBottom();
}

// Gemini API REST Endpoint Caller
async function callGeminiAPI(userPrompt) {
    // Primary API model endpoint: gemini-2.5-flash or gemini-1.5-flash
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

    const requestBody = {
        system_instruction: {
            parts: [{ text: GEMINI_SYSTEM_INSTRUCTION }]
        },
        contents: chatHistory,
        generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 300
        }
    };

    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
        // Retry with gemini-1.5-flash if 2.5 endpoint responds with error
        const fallbackUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
        const retryResponse = await fetch(fallbackUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody)
        });

        if (!retryResponse.ok) {
            throw new Error(`Gemini API HTTP Error: ${retryResponse.status}`);
        }

        const retryData = await retryResponse.json();
        return retryData.candidates[0].content.parts[0].text;
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
}

// Client-Side Intelligent Boutique Fallback (Ensures 100% Seamless Experience)
function getBoutiqueFallbackResponse(query) {
    const q = query.toLowerCase();

    if (q.includes("water") || q.includes("rain") || q.includes("swim")) {
        return "All Zarnab timepieces feature minimum 50m (5 ATM) water resistance, while our flagship *Royal Chrono Sapphire* is rated for 100m. We recommend avoiding hot showers to preserve strap seal integrity.";
    }
    if (q.includes("warranty") || q.includes("guarantee") || q.includes("repair")) {
        return "Every Zarnab watch includes our 5-Year International Luxury Warranty covering movement precision, dial integrity, and manufacturing craftsmanship. For warranty claims, contact concierge@Zarnabwatches.com.";
    }
    if (q.includes("engrav") || q.includes("custom") || q.includes("gift")) {
        return "We offer complimentary bespoke laser engraving (up to 20 characters) on back cases for special occasions. Please select 'Custom Order' in our Boutique Contact form or reach out via WhatsApp!";
    }
    if (q.includes("size") || q.includes("strap") || q.includes("fit")) {
        return "Our mesh and leather straps are fully adjustable. All watch orders include a complimentary pin adjustment tool and sizing guide. Need assistance? Visit our showroom or chat with us on WhatsApp.";
    }
    if (q.includes("price") || q.includes("cost") || q.includes("stock") || q.includes("buy")) {
        return "Our curated collection ranges from $290 to $520 USD. You can browse our Featured Collection right here and click 'Add to Cart' or 'Quick View' for instant ordering!";
    }

    return "Thank you for asking! As Zara at Zarnab Watches, I'm delighted to assist. All our watches come with a 5-Year Luxury Warranty, sapphire glass, and complimentary express shipping. For bespoke orders or specific inquiries, feel free to drop a message in our Boutique Contact form!";
}

// Append Chat Message to UI
function appendChatMessage(sender, text) {
    const messagesContainer = document.getElementById("chat-messages");
    if (!messagesContainer) return;

    const messageDiv = document.createElement("div");
    messageDiv.className = `message ${sender}-message`;

    // Simple formatting for bold text
    const formattedText = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    messageDiv.innerHTML = `
        <div class="message-content">
            <p>${formattedText}</p>
        </div>
        <span class="message-time">Just now</span>
    `;

    messagesContainer.appendChild(messageDiv);
    scrollChatToBottom();
}

function scrollChatToBottom() {
    const messagesContainer = document.getElementById("chat-messages");
    if (messagesContainer) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
}
