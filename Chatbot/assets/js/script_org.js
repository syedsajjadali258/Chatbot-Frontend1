
    const typingForm = document.querySelector(".typing-form");
const chatContainer = document.querySelector(".chat-list");
const suggestions = document.querySelectorAll(".suggestion");
const toggleThemeButton = document.querySelector("#theme-toggle-button");
const deleteChatButton = document.querySelector("#delete-chat-button");
// State variables
let userMessage = null;
let isResponseGenerating = false;
// API configuration
const API_KEY = "PASTE-YOUR-API-KEY"; // Your API key here
const API_URL = `https://api.publicapis.org/entries`;
// Load theme and chat data from local storage on page load
const loadDataFromLocalstorage = () => {
  const savedChats = localStorage.getItem("saved-chats");
  const isLightMode = (localStorage.getItem("themeColor") === "light_mode");
  // Apply the stored theme
  document.body.classList.toggle("light_mode", isLightMode);
  toggleThemeButton.innerText = isLightMode ? "dark_mode" : "light_mode";
  // Restore saved chats or clear the chat container
  chatContainer.innerHTML = savedChats || '';
  document.body.classList.toggle("hide-header", savedChats);
  chatContainer.scrollTo(0, chatContainer.scrollHeight); // Scroll to the bottom
}
// Create a new message element and return it
const createMessageElement = (content, ...classes) => {
  const div = document.createElement("div");
  div.classList.add("message", ...classes);
  div.innerHTML = content;
  return div;
}
// Show typing effect by displaying words one by one
const showTypingEffect = (text, textElement, incomingMessageDiv) => {
  const words = text.split(' ');
  let currentWordIndex = 0;
  const typingInterval = setInterval(() => {
    // Append each word to the text element with a space
    textElement.innerText += (currentWordIndex === 0 ? '' : ' ') + words[currentWordIndex++];
    incomingMessageDiv.querySelector(".icon").classList.add("hide");
    // If all words are displayed
    if (currentWordIndex === words.length) {
      clearInterval(typingInterval);
      isResponseGenerating = false;
      incomingMessageDiv.querySelector(".icon").classList.remove("hide");
      localStorage.setItem("saved-chats", chatContainer.innerHTML); // Save chats to local storage
    }
    chatContainer.scrollTo(0, chatContainer.scrollHeight); // Scroll to the bottom
  }, 75);
}
// Fetch response from the API based on user message
const generateAPIResponse = async (incomingMessageDiv) => {
  const textElement = incomingMessageDiv.querySelector(".text"); // Getting text element
  try {
    // Send a POST request to the API with the user's message
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        contents: [{ 
          role: "user", 
          parts: [{ text: userMessage }] 
        }] 
      }),
    });
    console.log(data);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error.message);
    // Get the API response text and remove asterisks from it
    const apiResponse = data.candidates[0].content.parts[0].text.replace(/\*\*(.*?)\*\*/g, '$1');
    showTypingEffect(apiResponse, textElement, incomingMessageDiv); // Show typing effect
  } catch (error) { // Handle error
    isResponseGenerating = false;
    textElement.innerText = error.message;
    textElement.parentElement.closest(".message").classList.add("error");
  } finally {
    incomingMessageDiv.classList.remove("loading");
  }
}
// Show a loading animation while waiting for the API response
const showLoadingAnimation = () => {
  const html = `<div class="message-content">
                  <img class="avatar" src="assets/images/ImportedPhoto.754388326.798846-removebg-preview.png" alt="edu hyd">
                  <p class="text"></p>
                  <div class="loading-indicator">
                    <div class="loading-bar"></div>
                    <div class="loading-bar"></div>
                    <div class="loading-bar"></div>
                  </div>
                </div>
                <span onClick="copyMessage(this)" class="icon material-symbols-rounded">content_copy</span>`;
  const incomingMessageDiv = createMessageElement(html, "incoming", "loading");
  chatContainer.appendChild(incomingMessageDiv);
  chatContainer.scrollTo(0, chatContainer.scrollHeight); // Scroll to the bottom
  generateAPIResponse(incomingMessageDiv);
}
// Copy message text to the clipboard
const copyMessage = (copyButton) => {
  const messageText = copyButton.parentElement.querySelector(".text").innerText;
  navigator.clipboard.writeText(messageText);
  copyButton.innerText = "done"; // Show confirmation icon
  setTimeout(() => copyButton.innerText = "content_copy", 1000); // Revert icon after 1 second
}
// Handle sending outgoing chat messages
const handleOutgoingChat = () => {
  userMessage = typingForm.querySelector(".typing-input").value.trim() || userMessage;
  if(!userMessage || isResponseGenerating) return; // Exit if there is no message or response is generating
  isResponseGenerating = true;
  const html = `<div class="message-content">
                  <img class="avatar" src="assets/images/user.png" alt="User avatar">
                  <p class="text"></p>
                </div>`;
  const outgoingMessageDiv = createMessageElement(html, "outgoing");
  outgoingMessageDiv.querySelector(".text").innerText = userMessage;
  chatContainer.appendChild(outgoingMessageDiv);
  
  typingForm.reset(); // Clear input field
  document.body.classList.add("hide-header");
  chatContainer.scrollTo(0, chatContainer.scrollHeight); // Scroll to the bottom
  setTimeout(showLoadingAnimation, 500); // Show loading animation after a delay
}
// Toggle between light and dark themes
toggleThemeButton.addEventListener("click", () => {
  const isLightMode = document.body.classList.toggle("light_mode");
  localStorage.setItem("themeColor", isLightMode ? "light_mode" : "dark_mode");
  toggleThemeButton.innerText = isLightMode ? "dark_mode" : "light_mode";
});
// Delete all chats from local storage when button is clicked
deleteChatButton.addEventListener("click", () => {
  if (confirm("Are you sure you want to delete all the chats?")) {
    localStorage.removeItem("saved-chats");
    loadDataFromLocalstorage();
  }
});
// Set userMessage and handle outgoing chat when a suggestion is clicked
suggestions.forEach(suggestion => {
  suggestion.addEventListener("click", () => {
    userMessage = suggestion.querySelector(".text").innerText;
    handleOutgoingChat();
  });
});
// Prevent default form submission and handle outgoing chat
typingForm.addEventListener("submit", (e) => {
  e.preventDefault(); 
  handleOutgoingChat();
});
const voiceNoteButton = document.querySelector("#voice-note-button");
let isListening = false;

// Configure SpeechRecognition (Web Speech API)
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();

recognition.lang = "en-US";// Set language to English (US)
// recognition.lang = "ur-PK"; 
recognition.continuous = false; // Stop automatically after one phrase
recognition.interimResults = false; // Wait for the final result before capturing text

// Start voice recognition
voiceNoteButton.addEventListener("click", () => {
  if (isListening) {
    recognition.stop();
    isListening = false;
    voiceNoteButton.classList.remove("recording");
  } else {
    recognition.start();
    isListening = true;
    voiceNoteButton.classList.add("recording");
  }
});

// Handle voice input result
recognition.addEventListener("result", (event) => {
  const transcript = event.results[0][0].transcript.trim();
  typingForm.querySelector(".typing-input").value = transcript;
  isListening = false;
  voiceNoteButton.classList.remove("recording");
});

// Handle recognition errors
recognition.addEventListener("error", (event) => {
  console.error("Speech recognition error:", event.error);
  isListening = false;
  voiceNoteButton.classList.remove("recording");
});

// Handle recognition end (when user stops speaking)
recognition.addEventListener("end", () => {
  isListening = false;
  voiceNoteButton.classList.remove("recording");
});
// Select DOM elements
const playResponseButton = document.getElementById('play-response-button');

// Text-to-Speech (TTS) Function
function speakResponse(responseText) {
  if ('speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(responseText);
    utterance.lang = 'en-US';
    utterance.pitch = 1; // Voice pitch (default is 1)
    utterance.rate = 1; // Speed of speech (default is 1)
    utterance.volume = 1; // Volume (0 to 1)

    // Speak the text
    window.speechSynthesis.speak(utterance);
  } else {
    alert('Text-to-Speech is not supported in your browser.');
  }
}

// Example: Add a click event to play a predefined response
playResponseButton.addEventListener('click', () => {
  const responseText = "Welcome to Educate Hyderabad!Explore the AI world and discover endless possibilities!"; // Replace with dynamic response
  speakResponse(responseText);
});

// Optionally, speak responses programmatically when they are displayed
function displayResponse(responseText) {
  const chatList = document.querySelector('.chat-list');
  const responseElement = document.createElement('div');
  responseElement.textContent = responseText;
  chatList.appendChild(responseElement);

  // Speak the response
  speakResponse(responseText);
}

loadDataFromLocalstorage();

document.addEventListener("DOMContentLoaded", () => {
  const welcomeText = document.getElementById("welcomeText");
  const currentHour = new Date().getHours(24);
  let greeting;

  if (currentHour >= 5 && currentHour < 12) {
    greeting = "Good Morning!";
  } else if (currentHour >= 12 && currentHour < 17) {
    greeting = "Good Afternoon!";
  } else {
    greeting = "Good Evening!";
  }

  welcomeText.textContent = greeting;
  welcomeText.style.opacity = 1; // Fade-in effect
});
 // Add event listeners for translation and speech buttons
 
// const translateToEnglishButton = document.getElementById('translate-to-english');
// const translateToUrduButton = document.getElementById('translate-to-urdu');

// translateToEnglishButton.addEventListener('click', async () => {
//   const originalText = document.querySelector('.typing-input').value.trim();
//   const translatedText = await translateText(originalText, 'EN');
//   document.querySelector('.typing-input').value = translatedText;
//   speakResponse(translatedText, 'en-US'); 

// translateToUrduButton.addEventListener('click', async () => {
//   const originalText = document.querySelector('.typing-input').value.trim();
//   const translatedText = await translateText(originalText, 'UR');
//   document.querySelector('.typing-input').value = translatedText;
//   speakResponse(translatedText, 'ur-PK'); 
// });
// async function displayAndSpeakResponse(responseText, lang = 'en-US') {
//   const chatList = document.querySelector('.chat-list');
//   const responseElement = document.createElement('div');
//   responseElement.textContent = responseText;
//   chatList.appendChild(responseElement);

  
//   if (lang === 'ur-PK') {
//     const translatedText = await translateText(responseText, 'UR');
//     responseElement.textContent = translatedText;
//     speakResponse(translatedText, 'ur-PK');
//   } else {
//     speakResponse(responseText, lang);
//   }
// }
